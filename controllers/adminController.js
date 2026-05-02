const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendVerificationEmail } = require("../utils/mailer");
const jwt = require("jsonwebtoken");

// ADMIN: create admin (protected route - only admins can create another admin)
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      name: name || "Admin",
      profilePic: req.file ? req.file.path : "",
    });

    const verifyToken = jwt.sign({ email: admin.email }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });
    await sendVerificationEmail(admin.email, verifyToken);

    res.status(201).json({
      message: "Admin created. Verification email sent.",
      user: { id: admin._id, email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create admin", error: error.message });
  }
};

// ADMIN: list users (kids)
exports.listKids = async (req, res) => {
  try {
    const kids = await User.find({ role: "kid" }).select("-password");
    res.json(kids);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch kids" });
  }
};

// ADMIN: deactivate/activate user
exports.setUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = Boolean(isActive);
    await user.save();

    res.json({ message: "User status updated", user: { id: user._id, isActive: user.isActive } });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status" });
  }
};
