const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authmiddleware"); // Add this line

router.use(authMiddleware); // Apply to all routes below

router.get("/search", async (req, res) => {
  const { query } = req.query;
  const excludeUsername = req.user?.username;
  if (!query) return res.status(400).json({ message: "No search query" });

  try {
    const users = await User.find({
      username: { $regex: query, $options: "i", $ne: excludeUsername },
    }).select("_id username email");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/messages/:userId", async (req, res) => {
  const userId = req.user._id;
  const otherUserId = req.params.userId;
  try {
    // Mark all messages sent to the logged-in user by the other user as seen
    await require("../models/Message").updateMany(
      { sender: otherUserId, receiver: userId, seen: false },
      { $set: { seen: true } }
    );
    const messages = await require("../models/Message")
      .find({
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId },
        ],
      })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/latest-messages", async (req, res) => {
  const userId = req.user._id;
  try {
    // Find all users except self
    const users = await User.find({ _id: { $ne: userId } }).select(
      "_id username email"
    );
    // For each user, get the latest message between the logged-in user and them
    const results = await Promise.all(
      users.map(async (u) => {
        const msg = await require("../models/Message")
          .findOne({
            $or: [
              { sender: userId, receiver: u._id },
              { sender: u._id, receiver: userId },
            ],
          })
          .sort({ timestamp: -1 });
        return {
          user: u,
          latestMessage: msg
            ? {
                content: msg.content,
                timestamp: msg.timestamp,
                sender: msg.sender,
                receiver: msg.receiver,
              }
            : null,
        };
      })
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
