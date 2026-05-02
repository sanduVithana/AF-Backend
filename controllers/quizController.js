const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const User = require("../models/User");

// ----------------------------
// ADMIN: Create Quiz
// POST /api/quizzes
// Body: { experiment_id, title, questions[] }
// ----------------------------
exports.createQuiz = async (req, res) => {
  try {
    const { experiment_id, title, questions } = req.body;

    if (!Number.isInteger(experiment_id)) {
      return res.status(400).json({ message: "experiment_id must be a number" });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "questions must be a non-empty array" });
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ message: `Invalid question at index ${i}` });
      }
      if (
        typeof q.correctIndex !== "number" ||
        q.correctIndex < 0 ||
        q.correctIndex >= q.options.length
      ) {
        return res
          .status(400)
          .json({ message: `Invalid correctIndex at question index ${i}` });
      }
    }

    // Optional: 1 quiz per experiment
    const existing = await Quiz.findOne({ experiment_id });
    if (existing) {
      return res.status(409).json({ message: "Quiz already exists for this experiment" });
    }

    const adminUserId = req.user?.user_id ?? null;

    const quiz = await Quiz.create({
      experiment_id,
      title: title || "",
      questions,
      createdBy_user_id: adminUserId
    });

    res.status(201).json({ message: "Quiz created", quiz });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------
// ADMIN: Update Quiz
// PUT /api/quizzes/:quiz_id
// ----------------------------
exports.updateQuiz = async (req, res) => {
  try {
    const quiz_id = Number(req.params.quiz_id);
    if (!Number.isInteger(quiz_id)) return res.status(400).json({ message: "Invalid quiz_id" });

    const { title, isActive, questions } = req.body;

    const quiz = await Quiz.findOne({ quiz_id });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (typeof title === "string") quiz.title = title;
    if (typeof isActive === "boolean") quiz.isActive = isActive;

    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: "questions must be a non-empty array" });
      }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({ message: `Invalid question at index ${i}` });
        }
        if (
          typeof q.correctIndex !== "number" ||
          q.correctIndex < 0 ||
          q.correctIndex >= q.options.length
        ) {
          return res
            .status(400)
            .json({ message: `Invalid correctIndex at question index ${i}` });
        }
      }
      quiz.questions = questions;
    }

    await quiz.save();
    res.json({ message: "Quiz updated", quiz });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------
// ADMIN: Delete Quiz
// DELETE /api/quizzes/:quiz_id
// ----------------------------
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz_id = Number(req.params.quiz_id);
    if (!Number.isInteger(quiz_id)) return res.status(400).json({ message: "Invalid quiz_id" });

    const quiz = await Quiz.findOneAndDelete({ quiz_id });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    await QuizResult.deleteMany({ quiz_id });

    res.json({ message: "Quiz deleted (and results removed)" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------
// KID/ADMIN: Get Quiz for an experiment (NO correct answers)
// GET /api/quizzes/experiment/:experiment_id
// ----------------------------
exports.getQuizForExperiment = async (req, res) => {
  try {
    const experiment_id = Number(req.params.experiment_id);
    if (!Number.isInteger(experiment_id)) {
      return res.status(400).json({ message: "Invalid experiment_id" });
    }

    const quiz = await Quiz.findOne({ experiment_id, isActive: true }).lean();
    if (!quiz) return res.status(404).json({ message: "No active quiz for this experiment" });

    // Remove correctIndex before sending
    const safeQuestions = quiz.questions.map((q) => ({
      questionText: q.questionText,
      options: q.options
      // explanation NOT sent here; it will be sent after submission in feedback
    }));

    res.json({
      quiz: {
        quiz_id: quiz.quiz_id,
        experiment_id: quiz.experiment_id,
        title: quiz.title,
        totalQuestions: safeQuestions.length,
        questions: safeQuestions
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------
// KID: Submit Quiz (Multiple attempts)
// POST /api/quizzes/:quiz_id/submit
// Body: { answers: [index,index,...] }
// ----------------------------
exports.submitQuiz = async (req, res) => {
  try {
    const quiz_id = Number(req.params.quiz_id);
    if (!Number.isInteger(quiz_id)) return res.status(400).json({ message: "Invalid quiz_id" });

    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "answers must be an array" });
    }

    const quiz = await Quiz.findOne({ quiz_id }).lean();
    if (!quiz || quiz.isActive !== true) {
      return res.status(404).json({ message: "Quiz not found or inactive" });
    }

    const kid_id = req.user?.user_id;
    if (!Number.isInteger(kid_id)) {
      return res.status(401).json({ message: "Invalid kid session" });
    }

    const totalQuestions = quiz.questions.length;

    // normalize answers length
    const normalizedAnswers = Array.from({ length: totalQuestions }, (_, i) =>
      typeof answers[i] === "number" ? answers[i] : null
    );

    // attempt number
    const prevCount = await QuizResult.countDocuments({ kid_id, quiz_id });
    const attemptNumber = prevCount + 1;

    let correctCount = 0;

    const perQuestion = quiz.questions.map((q, idx) => {
      const selectedIndex = normalizedAnswers[idx];
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) correctCount++;

      return {
        questionIndex: idx,
        selectedIndex,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation || ""
      };
    });

    const percentage =
      totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

    // Save attempt
    const result = await QuizResult.create({
      kid_id,
      quiz_id,
      experiment_id: quiz.experiment_id,
      attemptNumber,
      answers: normalizedAnswers,
      totalQuestions,
      correctCount,
      percentage,
      perQuestion
    });

    // Update User quizStats (no badges)
    const user = await User.findOne({ user_id: kid_id });
    if (user) {
      user.quizStats.attempts += 1;
      user.quizStats.totalCorrect += correctCount;
      user.quizStats.totalQuestions += totalQuestions;

      user.quizStats.totalPercentSum += percentage;
      user.quizStats.avgPercent = Math.round(
        user.quizStats.totalPercentSum / user.quizStats.attempts
      );
      user.quizStats.lastPercent = percentage;

      await user.save();
    }

    // completion rule = attempt = complete
    // (You can show completion on frontend by checking if there is any QuizResult for that experiment)

    res.status(201).json({
      message: "Quiz submitted",
      result: {
        quiz_id,
        experiment_id: quiz.experiment_id,
        attemptNumber,
        totalQuestions,
        correctCount,
        percentage,
        perQuestion // question-by-question feedback (includes correct answers + explanation)
      },
      updatedUserStats: user ? user.quizStats : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------
// KID: My Results (history)
// GET /api/quizzes/my-results
// ----------------------------
exports.getMyResults = async (req, res) => {
  try {
    const kid_id = req.user?.user_id;
    if (!Number.isInteger(kid_id)) return res.status(401).json({ message: "Invalid session" });

    const results = await QuizResult.find({ kid_id }).sort({ createdAt: -1 });
    res.json({ count: results.length, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------
// ADMIN: Results by experiment_id
// GET /api/quizzes/experiment/:experiment_id/results
// ----------------------------
exports.getResultsByExperiment = async (req, res) => {
  try {
    const experiment_id = Number(req.params.experiment_id);
    if (!Number.isInteger(experiment_id)) {
      return res.status(400).json({ message: "Invalid experiment_id" });
    }

    const results = await QuizResult.find({ experiment_id }).sort({ createdAt: -1 });
    res.json({ count: results.length, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({})
      .select("quiz_id experiment_id title isActive questions createdAt")
      .sort({ createdAt: -1 });

    res.json({ quizzes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};