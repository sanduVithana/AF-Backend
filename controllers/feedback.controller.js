const Feedback = require("../models/feedback.model");
const Experiment = require("../models/Experiment");
const User = require("../models/User");
const { sendFeedbackConfirmation } = require("../utils/mailer");

exports.createFeedback = async (req, res) => {
    try {
        const { experiment, feedbackType, comment, rating } = req.body;

        if (!experiment || !feedbackType || !comment || rating == null) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const experimentDoc = await Experiment.findOne({ experiment_id: experiment });
        if (!experimentDoc) {
            return res.status(404).json({ message: "Experiment not found" });
        }

        const existing = await Feedback.findOne({ student: req.user.id, experiment: experimentDoc._id });
        if (existing) {
            return res.status(409).json({ message: "You have already submitted feedback for this experiment" });
        }

        const feedback = await Feedback.create({
            student: req.user.id,
            experiment: experimentDoc._id,
            feedbackType,
            comment,
            rating,
        });

        const student = await User.findById(req.user.id);
        sendFeedbackConfirmation(
            student.email,
            student.name || "Scientist",
            experimentDoc.title,
            rating
        ).catch(() => { });

        res.status(201).json({ message: "Feedback created successfully", feedback });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Duplicate feedback not allowed" });
        }
        res.status(500).json({ message: "Failed to create feedback", error: error.message });
    }
};

exports.getExperimentFeedback = async (req, res) => {
    try {
        const { experimentId } = req.params;

        const experimentDoc = await Experiment.findOne({ experiment_id: experimentId });
        if (!experimentDoc) {
            return res.status(404).json({ message: "Experiment not found" });
        }

        const feedbacks = await Feedback.find({ experiment: experimentDoc._id })
            .populate("student", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({ count: feedbacks.length, feedbacks });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch feedback", error: error.message });
    }
};

exports.getMyFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ student: req.user.id })
            .populate("experiment", "title experiment_id")
            .sort({ createdAt: -1 });

        res.status(200).json({ count: feedbacks.length, feedbacks });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch your feedback", error: error.message });
    }
};

exports.updateFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedbackType, comment, rating } = req.body;

        const feedback = await Feedback.findOne({ feedback_id: id });
        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        if (req.user.role !== "admin" && feedback.student.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only update your own feedback" });
        }

        if (feedbackType) feedback.feedbackType = feedbackType;
        if (comment) feedback.comment = comment;
        if (rating != null) feedback.rating = rating;

        await feedback.save();

        res.status(200).json({ message: "Feedback updated successfully", feedback });
    } catch (error) {
        res.status(500).json({ message: "Failed to update feedback", error: error.message });
    }
};

exports.deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;

        const feedback = await Feedback.findOne({ feedback_id: id });
        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        if (req.user.role !== "admin" && feedback.student.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own feedback" });
        }

        await Feedback.findOneAndDelete({ feedback_id: id });

        res.status(200).json({ message: "Feedback deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete feedback", error: error.message });
    }
};

exports.getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate("student", "name email")
            .populate("experiment", "title experiment_id")
            .sort({ createdAt: -1 });

        res.status(200).json({ count: feedbacks.length, feedbacks });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch all feedback", error: error.message });
    }
};
