const jwt = require("jsonwebtoken");
const User = require("../models/user");
const SECRET_KEY = "your_secret_key";
const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user || user.token !== token) {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;
