const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (roles = []) => (req, res, next) => {
  const tokenHeader = req.header("Authorization");
  const token =
    tokenHeader && tokenHeader.startsWith("Bearer ")
      ? tokenHeader.split(" ")[1]
      : null;

  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. You do not have permission." });
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    return res.status(400).json({ message: "Invalid token", error: error.message });
  }
};

module.exports = authMiddleware;
