const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendVerificationEmail, sendResetPasswordEmail } = require("../utils/mailer");

require("dotenv").config();

/* =========================
   Helper: Sign JWT Token
========================= */
function signToken(user) {
  return jwt.sign(
    {
      id: user._id,          // MongoDB ID
      user_id: user.user_id, // Auto Increment ID
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.TOKEN_EXPIRES_IN || "24h" }
  );
}

/* =========================
   POST /api/auth/register-kid
========================= */
exports.registerKid = async (req, res) => {
  try {
    const { email, password, name, age, grade } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const kid = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "kid",
      name: name || "",
      age: age ?? null,
      grade: grade || "",
      profilePic: req.file ? req.file.path : "",
    });

    const verifyToken = jwt.sign(
      { email: kid.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    await sendVerificationEmail(kid.email, verifyToken);

    res.status(201).json({
      message: "Kid registered. Verification email sent.",
      user: {
        mongo_id: kid._id,
        user_id: kid.user_id,
        email: kid.email,
        role: kid.role,
        isVerified: kid.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

/* =========================
   POST /api/auth/login
========================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() }).select("+password");

    if (!user || !user.isActive) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        mongo_id: user._id,
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

/* =========================
   GET /api/auth/me
========================= */
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      mongo_id: user._id,
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name,
      age: user.age,
      grade: user.grade,
      profilePic: user.profilePic,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

/* =========================
   PUT /api/auth/me
   Kid/Admin update own profile
========================= */
exports.updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, age, grade, email } = req.body;

    if (email && email.toLowerCase() !== user.email) {
      const exists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });

      if (exists) {
        return res.status(409).json({ message: "Email already in use" });
      }

      user.email = email.toLowerCase();
      user.isVerified = false;

      const verifyToken = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1h" }
      );

      await sendVerificationEmail(user.email, verifyToken);
    }

    if (name !== undefined) user.name = name;
    if (age !== undefined) user.age = age === "" ? null : age;
    if (grade !== undefined) user.grade = grade;

    if (req.file) {
       user.profilePic = req.file.path;
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        mongo_id: user._id,
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        name: user.name,
        age: user.age,
        grade: user.grade,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
      note:
        email && email.toLowerCase() !== req.user.email
          ? "Email changed. Verification email sent to new address."
          : undefined,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

/* =========================
   DELETE /api/auth/me
   Kid/Admin delete own account
========================= */
exports.deleteMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      message: "Account deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete account",
      error: error.message,
    });
  }
};

/* =========================
   GET /api/auth/verify/:token
========================= */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

/* =========================
   POST /api/auth/forgot-password
========================= */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    await sendResetPasswordEmail(user.email, resetToken);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send reset email",
      error: error.message,
    });
  }
};

/* =========================
   POST /api/auth/reset-password/:token
========================= */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findOne({ email: decoded.email }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(password, 12);
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

/* =========================
   PUT /api/auth/change-password
   Logged-in user changes own password*/
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to change password",
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, age, grade } = req.body;

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name ?? user.name;
    user.age = age !== undefined && age !== "" ? age : user.age;
    user.grade = grade ?? user.grade;

    if (req.file) {
  user.profilePic = req.file.path;
}

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        mongo_id: user._id,
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        name: user.name,
        age: user.age,
        grade: user.grade,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
};