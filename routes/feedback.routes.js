const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback.controller");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware(["kid"]), feedbackController.createFeedback);
router.get("/experiment/:experimentId", feedbackController.getExperimentFeedback);
router.get("/my", authMiddleware(["kid"]), feedbackController.getMyFeedback);
router.put("/:id", authMiddleware(["kid", "admin"]), feedbackController.updateFeedback);
router.delete("/:id", authMiddleware(["kid", "admin"]), feedbackController.deleteFeedback);
router.get("/admin/all", authMiddleware(["admin"]), feedbackController.getAllFeedback);

module.exports = router;
