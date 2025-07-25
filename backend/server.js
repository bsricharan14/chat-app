// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");
const User = require("./models/User");
const { setIO } = require("./socket");
// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const allowedOrigins = [
  "https://chat-app-frontend-tc6y.onrender.com", // Replace with your deployed frontend URL
  "http://localhost:3000"
];

// Setup Express
const app = express();
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Routes: only authentication for now
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/left", require("./routes/leftRoutes"));
app.use("/api/gemini", require("./routes/geminiRoutes"));

// Health check or root
app.get("/", (req, res) => {
  res.send("API is running");
});

// Socket.IO setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});
setIO(io);

const onlineUsers = new Map(); // userId -> Set of socketIds

// Socket.IO logic
io.on("connection", (socket) => {
  // Join room for user (by userId)
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  // When a user joins, they should emit their userId
  socket.on("userOnline", (userId) => {
    socket.userId = userId;
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    io.emit("userStatus", { userId, status: "online" });
  });

  // Emit the current online users to the newly connected client
  socket.emit("onlineUsers", Array.from(onlineUsers.keys()));

  socket.on("disconnect", () => {
    const { userId } = socket;
    if (userId && onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
        io.emit("userStatus", { userId, status: "offline" });
      }
    }
  });

  // Listen for sending a message
  socket.on("sendMessage", async (data) => {
    // data: { senderId, receiverId, content }
    try {
      const message = new Message({
        sender: data.senderId,
        receiver: data.receiverId,
        content: data.content,
      });
      await message.save();

      // Emit to receiver's room
      io.to(data.receiverId).emit("receiveMessage", {
        _id: message._id,
        sender: data.senderId,
        receiver: data.receiverId,
        content: data.content,
        timestamp: message.timestamp,
        seen: false,
      });

      // Emit to sender's room (not just the socket)
      io.to(data.senderId).emit("messageSent", {
        _id: message._id,
        sender: data.senderId,
        receiver: data.receiverId,
        content: data.content,
        timestamp: message.timestamp,
        seen: false,
      });
    } catch (err) {
      console.error("Socket message error:", err);
    }
  });

  // Listen for marking messages as seen
  socket.on("markAsSeen", async ({ userId, otherUserId }) => {
    try {
      const updated = await Message.updateMany(
        { sender: otherUserId, receiver: userId, seen: false },
        { $set: { seen: true } }
      );
      // Notify the sender that their messages have been seen
      io.to(otherUserId).emit("messageSeen", { by: userId });
    } catch (err) {
      console.error("Socket markAsSeen error:", err);
    }
  });

  // Listen for deleting messages
  socket.on("deleteMessages", async ({ messageIds, userId, otherUserId }) => {
    try {
      // Mark messages as deleted
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { content: "[ deleted message ]", deleted: true, edited: false } }
      );
      // Notify both users to update their UI
      io.to(userId).emit("messagesDeleted", { messageIds });
      io.to(otherUserId).emit("messagesDeleted", { messageIds });
    } catch (err) {
      console.error("Socket deleteMessages error:", err);
    }
  });

  // Typing indicator
  socket.on("typing", ({ to, from }) => {
    io.to(to).emit("typing", { from });
  });
  socket.on("stopTyping", ({ to, from }) => {
    io.to(to).emit("stopTyping", { from });
  });

  socket.on("editMessage", (msg) => {
    // msg should contain at least: _id, sender, receiver, content, edited, timestamp
    if (msg.sender && msg.receiver) {
      io.to(msg.sender.toString()).emit("editMessage", msg);
      io.to(msg.receiver.toString()).emit("editMessage", msg);
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
