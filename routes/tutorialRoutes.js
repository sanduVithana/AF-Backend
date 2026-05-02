const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const tutorialController = require("../controllers/tutorialController");

// Admin CRUD
router.post("/", authMiddleware(["admin"]), tutorialController.createTutorial);
router.put("/:id", authMiddleware(["admin"]), tutorialController.updateTutorial);
router.delete("/:id", authMiddleware(["admin"]), tutorialController.deleteTutorial);

// List by experiment
router.get("/experiment/:experimentId", authMiddleware(["admin", "kid"]), tutorialController.listTutorialsByExperiment);

// Read
router.get("/:id", authMiddleware(["admin", "kid"]), tutorialController.getTutorial);
router.get("/:id/steps", authMiddleware(["admin", "kid"]), tutorialController.getTutorialSteps);

// YouTube attach
router.patch("/:id/youtube/select", authMiddleware(["admin"]), tutorialController.selectYoutubeVideo);

module.exports = router;
