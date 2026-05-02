const express = require("express");
const router = express.Router();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const experimentRoutes = require("./routes/experimentRoutes");
const tutorialRoutes = require("./routes/tutorialRoutes");
const youtubeRoutes = require("./routes/youtubeRoutes");
const orderRoutes = require("./routes/orderRoutes");
const feedbackRoutes = require("./routes/feedback.routes");
const progressRoutes = require("./routes/progress.routes");

const quizRoutes = require("./routes/quizRoutes");

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/experiments", experimentRoutes);
router.use("/orders", orderRoutes);
router.use("/tutorials", tutorialRoutes);
router.use("/youtube", youtubeRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/progress", progressRoutes);

router.use("/quizzes", quizRoutes);

module.exports = router;
