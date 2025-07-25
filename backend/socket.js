const { Server } = require("socket.io");
const Message = require("./models/Message");
const User = require("./models/User");

let io = null;

const onlineUsers = new Map(); // userId -> Set of socketIds

function socketHandler(server, allowedOrigins) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  // Export io for use in routes (e.g., forceLogout)
  module.exports.io = io;

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
        await Message.updateMany(
          { sender: otherUserId, receiver: userId, seen: false },
          { $set: { seen: true } }
        );
        io.to(otherUserId).emit("messageSeen", { by: userId });
      } catch (err) {
        console.error("Socket markAsSeen error:", err);
      }
    });

    // Listen for deleting messages
    socket.on("deleteMessages", async ({ messageIds, userId, otherUserId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { content: "[ deleted message ]", deleted: true, edited: false } }
        );
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

    // Listen for editing messages
    socket.on("editMessage", (msg) => {
      if (msg.sender && msg.receiver) {
        io.to(msg.sender.toString()).emit("editMessage", msg);
        io.to(msg.receiver.toString()).emit("editMessage", msg);
      }
    });
  });
}

// Export for use in routes (e.g., forceLogout)
module.exports = function(server, allowedOrigins) {
  socketHandler(server, allowedOrigins);
};
module.exports.getIO = () => io;