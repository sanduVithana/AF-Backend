const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progress.controller");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/complete/:experimentId", authMiddleware(["kid"]), progressController.completeExperiment);
router.get("/my", authMiddleware(["kid"]), progressController.getMyProgress);
router.get("/admin/all", authMiddleware(["admin"]), progressController.getAllProgress);

module.exports = router;
