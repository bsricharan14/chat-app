// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const http = require("http");
const path = require("path");

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

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/left", require("./routes/leftRoutes"));
app.use("/api/gemini", require("./routes/geminiRoutes"));

// Health check
app.get("/", (req, res) => {
  res.send("API is running");
});

// Serve static files if needed (for production, if you want to serve frontend from backend)
// Uncomment if you want to serve frontend build from backend
// app.use(express.static(path.join(__dirname, "../frontend/build")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
// });

// Create HTTP server and attach Socket.IO in socket.js
const server = http.createServer(app);

// Pass server to socket.js to initialize Socket.IO
require("./socket")(server, allowedOrigins);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
