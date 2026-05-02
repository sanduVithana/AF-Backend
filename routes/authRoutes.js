const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const authController = require("../controllers/authController");

// kid registration (with optional profile image)
router.post("/register-kid", upload.single("profile_image"), authController.registerKid);

router.put(
  "/me",
  authMiddleware(["admin", "kid"]),
  upload.single("profile_image"),
  authController.updateProfile
);

router.post("/login", authController.login);

// current user profile
router.get("/me", authMiddleware(["admin", "kid"]), authController.me);
router.put(
  "/me",
  authMiddleware(["admin", "kid"]),
  upload.single("profile_image"),
  authController.updateMe
);
router.delete("/me", authMiddleware(["admin", "kid"]), authController.deleteMe);

// change password while logged in
router.put("/change-password", authMiddleware(["admin", "kid"]), authController.changePassword);

// email verification
router.get("/verify/:token", authController.verifyEmail);

// forgot/reset password
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

// reset password test form for backend-only testing
router.get("/reset-password/:token", (req, res) => {
  res.send(`
    <h2>Reset Password</h2>
    <form method="POST" action="/api/auth/reset-password/${req.params.token}">
      <input type="password" name="password" placeholder="Enter new password" required />
      <button type="submit">Reset Password</button>
    </form>
  `);
});

module.exports = router;