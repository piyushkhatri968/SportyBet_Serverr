const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Otp = require("../models/otp");
const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");
const UserImage = require("../models/UserImage")

const router = express.Router();
const SECRET_KEY = "your_secret_key"; // Change this to a secure secret

// Generate Random 6-Digit OTP
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * 1️⃣ Send OTP (Just shows OTP instead of sending SMS)
 */
router.post("/send-otp", async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber)
    return res.status(400).json({ error: "Mobile number is required" });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

  await Otp.findOneAndUpdate(
    { mobileNumber },
    { otp, expiresAt },
    { upsert: true, new: true }
  );

  res.json({ success: true, message: `OTP generated: ${otp}` }); // Show OTP in response
});

/**
 * 2️⃣ Verify OTP
 */
router.post("/verify-otp", async (req, res) => {
  const { mobileNumber, otp } = req.body;

  const otpRecord = await Otp.findOne({ mobileNumber });
  if (!otpRecord) return res.status(400).json({ error: "Invalid OTP" });

  if (otpRecord.otp !== otp)
    return res.status(400).json({ error: "Incorrect OTP" });
  if (new Date() > otpRecord.expiresAt)
    return res.status(400).json({ error: "OTP expired" });

  res.json({ success: true, message: "OTP verified successfully" });
});



router.post("/register", async (req, res) => {
  const {
    name,
    password,
    username,
    email,
    expiryDate,
    subscription,
    role,
    mobileNumber,
  } = req.body;

  console.log("Register request:", req.body);

  // ✅ Validate all fields
  if (
    !name || !password || !username || !email ||
    !expiryDate || !subscription || !role || !mobileNumber
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required including mobile number.",
    });
  }

  try {
    // ✅ Check if username, email, or mobile already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }, { mobileNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username, email, or mobile number already exists.",
      });
    }

    // ✅ Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ✅ Convert expiryDate to proper Date object
    const expiry = new Date(expiryDate);
    if (isNaN(expiry)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expiry date format.",
      });
    }

    // ✅ Create and save new user
    const newUser = new User({
      name,
      password: hashedPassword,
      username,
      email,
      mobileNumber,
      subscription,
      expiry,
      role,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        mobileNumber: newUser.mobileNumber,
        role: newUser.role,
      },
    });

  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


router.post("/login", async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email, username, or mobile number

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: "Both fields are required" });
  }

  try {
    // ✅ Try finding user by email, username, or mobileNumber
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier },
        { mobileNumber: identifier },
      ],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // ✅ Generate JWT
    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, {
      expiresIn: "7d",
    });

    // ✅ Save token in DB
    await User.findByIdAndUpdate(user._id, { token });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.get("/user/profile", authMiddleware, async (req, res) => {
  try {
    // Get user ID from request after authentication
    const userId = req.user.id;

    // Fetch user data from the database (excluding password)
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/update-user-icon", async (req, res) => {
  const { userId, imageUrl } = req.body;

  if (!userId || !imageUrl) {
    return res
      .status(400)
      .json({ error: "User ID and image URL are required" });
  }

  try {
    // Find the user and update the userIcon field
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { userIcon: imageUrl },
      { new: true } // Return the updated user document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "User icon updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user icon:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/update-name", async (req, res) => {
  try {
    console.log("Received Request Body:", req.body); // Debugging

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is empty" });
    }

    const { userId, newName } = req.body;

    if (!userId || !newName.trim()) {
      return res
        .status(400)
        .json({ message: "User ID and new name are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = newName;
    await user.save();

    res
      .status(200)
      .json({ message: "Name updated successfully", updatedName: user.name });
  } catch (error) {
    console.error("Error updating name:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || email.trim() === "" || !password || password.trim() === "") {
      return res
        .status(400)
        .json({ message: "email and password are required." });
    }
    if (
      (email !== "Capsiteafrica@gmail.com" || email !== "Moderator@gmail.com") &
      (password !== "Fiifi9088.")
    ) {
      return res.status(400).json({ message: "email or password is wrong." });
    }

    // Generate JWT token
    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "7d" });

    res.json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.error("Error in admin login", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/getAllUsers", async (req, res) => {
  try {
    const allUsers = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, allUsers });
  } catch (error) {
    console.error("Error fetching all users", error);
    res.status(500).json({ message: "Server error", errorr: error });
  }
});

router.delete("/admin/deleteUser/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // await User.findOneAndDelete(id);
    await User.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.log(error);
  }
});

router.get("/admin/getAllUsersByStatus", async (req, res) => {
  try {
    const allActiveUsers = await User.find({ accountStatus: "Active" }).sort({
      createdAt: -1,
    });
    const allDisableUsers = await User.find({ accountStatus: "Hold" }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, allActiveUsers, allDisableUsers });
  } catch (error) {
    console.error("Error fetching all users", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/admin/disableUserAccountStatus/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    await User.findByIdAndUpdate(id, { accountStatus: "Hold" });
    res
      .status(200)
      .json({ success: true, message: "User disabled successfully." });
  } catch (error) {
    console.error("Error disabling user", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/admin/activeUserAccountStatus/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Find user with 'Hold' status
    const user = await User.findOne({ _id: id, accountStatus: "Hold" });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found or not on Hold" });
    }

    // Update user status & expiry date
    await User.findByIdAndUpdate(id, {
      accountStatus: "Active",
    });

    res
      .status(200)
      .json({ success: true, message: "User activated successfully." });
  } catch (error) {
    console.error("Error activating user", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/admin/getExpiredUsers", async (req, res) => {
  try {
    const currentDate = new Date();

    // Find users where expiry date is before today
    const expiredUsers = await User.find({ expiry: { $lt: currentDate } });

    res.status(200).json({
      success: true,
      expiredUsers,
    });
  } catch (error) {
    console.error("Error fetching expired users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/admin/activeUserAccount/:id", async (req, res) => {
  const { id } = req.params;
  const { expiryDate } = req.body;

  try {
    if (!expiryDate || expiryDate === "none") {
      return res
        .status(400)
        .json({ success: false, message: "Select a valid expiry period" });
    }

    // Ensure expiryDate is a valid number
    const expiryDays = Number(expiryDate);
    if (isNaN(expiryDays) || expiryDays <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid expiry date" });
    }

    // Find user with 'Hold' status
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Calculate expiry date correctly
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);

    // Update user status & expiry date
    await User.findByIdAndUpdate(id, {
      expiry: expiry,
    });

    res
      .status(200)
      .json({ success: true, message: "User activated successfully." });
  } catch (error) {
    console.error("Error activating user", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/update-status/:userId", async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!["Active", "Hold"].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be 'Active' or 'Hold'." });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { accountStatus: status },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({
      message: `User status updated to '${status}'.`,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        mobileNumber: updatedUser.mobileNumber,
        accountStatus: updatedUser.accountStatus,
      },
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/update-profile", async (req, res) => {
  const { userId, username, amount, phone, email, imageUrl } = req.body;

  try {
    // Update User data
    await User.findByIdAndUpdate(userId, {
      username,
      amount,
      phone,
      email,
    });

    // Update User image
    await UserImage.findOneAndUpdate(
      { userId },
      { image: imageUrl }, // or full path
      { upsert: true }
    );

    return res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Update failed" });
  }
});

module.exports = router;

