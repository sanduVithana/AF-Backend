const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const quizController = require("../controllers/quizController");

// Admin
router.get("/", authMiddleware(["admin"]), quizController.getAllQuizzes);
router.post("/", authMiddleware(["admin"]), quizController.createQuiz);
router.put("/:quiz_id", authMiddleware(["admin"]), quizController.updateQuiz);
router.delete("/:quiz_id", authMiddleware(["admin"]), quizController.deleteQuiz);

// Kid/Admin fetch quiz by experiment_id (no answers)
router.get(
  "/experiment/:experiment_id",
  authMiddleware(["admin", "kid"]),
  quizController.getQuizForExperiment
);

// Kid submit quiz by quiz_id
router.post("/:quiz_id/submit", authMiddleware(["kid"]), quizController.submitQuiz);

// Kid result history
router.get("/my-results", authMiddleware(["kid"]), quizController.getMyResults);

// Admin results by experiment_id
router.get(
  "/experiment/:experiment_id/results",
  authMiddleware(["admin"]),
  quizController.getResultsByExperiment
);

module.exports = router;

