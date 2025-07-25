// backend/routes/authRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/authmiddleware");
const { getIO } = require("../socket"); // We'll create this helper
require("dotenv").config();

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { _id: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// @route   POST /api/auth/register
// @desc    Register new user
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide username, email, and password" });
  }
  try {
    // Check if email already exists
    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }
    // Check if username already exists
    const existingByUsername = await User.findOne({ username });
    if (existingByUsername) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    const userToReturn = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    };
    const token = generateToken(newUser);
    res.status(201).json({ user: userToReturn, token });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user by username or email and get token
router.post("/login", async (req, res) => {
  // Expect { identifier, password } in body
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res
      .status(400)
      .json({ message: "Please provide username/email and password" });
  }
  try {
    // Find user by email OR username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateToken(user);
    const userToReturn = {
      _id: user._id,
      username: user.username,
      email: user.email,
    };
    res.status(200).json({ user: userToReturn, token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/auth/delete-account
router.delete("/delete-account", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }
    await user.deleteOne();

    // Emit forceLogout to all sockets of this user
    const io = getIO();
    if (io) {
      io.to(user._id.toString()).emit("forceLogout");
    }

    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
