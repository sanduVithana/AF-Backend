const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const adminController = require("../controllers/adminController");

// only admin can access
router.post("/seed-admin", upload.single("profile_image"), adminController.createAdmin);
router.post("/create-admin", authMiddleware(["admin"]), upload.single("profile_image"), adminController.createAdmin);
router.get("/kids", authMiddleware(["admin"]), adminController.listKids);
router.patch("/user/:id/status", authMiddleware(["admin"]), adminController.setUserStatus);

module.exports = router;
