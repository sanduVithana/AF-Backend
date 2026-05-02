const Progress = require("../models/progress.model");
const Experiment = require("../models/Experiment");
const User = require("../models/User");
const { sendBadgeEarned } = require("../utils/mailer");

function calculateBadge(totalCompleted) {
    if (totalCompleted >= 30) return "Master Scientist";
    if (totalCompleted >= 20) return "Senior Innovator";
    if (totalCompleted >= 10) return "Junior Explorer";
    return "Beginner Scientist";
}

exports.completeExperiment = async (req, res) => {
    try {
        const { experimentId } = req.params;

        const experiment = await Experiment.findOne({ experiment_id: experimentId });
        if (!experiment) {
            return res.status(404).json({ message: "Experiment not found" });
        }

        let progress = await Progress.findOne({ student: req.user.id });

        if (!progress) {
            progress = await Progress.create({
                student: req.user.id,
                completedExperiments: [],
                totalCompleted: 0,
                badge: "Beginner Scientist",
            });
        }

        if (progress.completedExperiments.map(id => id.toString()).includes(experiment._id.toString())) {
            return res.status(409).json({ message: "Experiment already completed" });
        }

        const oldBadge = progress.badge;

        progress.completedExperiments.push(experiment._id);
        progress.totalCompleted = progress.completedExperiments.length;
        progress.badge = calculateBadge(progress.totalCompleted);

        await progress.save();

        if (progress.badge !== oldBadge) {
            const student = await User.findById(req.user.id);
            sendBadgeEarned(
                student.email,
                student.name || "Scientist",
                progress.badge,
                progress.totalCompleted
            ).catch(() => { });
        }

        res.status(200).json({
            message: "Experiment marked as completed",
            progress,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to mark experiment as completed", error: error.message });
    }
};

exports.getMyProgress = async (req, res) => {
    try {
        const progress = await Progress.findOne({ student: req.user.id })
            .populate("completedExperiments", "title experiment_id");

        if (!progress) {
            return res.status(200).json({
                progress: {
                    completedExperiments: [],
                    totalCompleted: 0,
                    badge: "Beginner Scientist",
                },
            });
        }

        res.status(200).json({ progress });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch progress", error: error.message });
    }
};

exports.getAllProgress = async (req, res) => {
    try {
        const allProgress = await Progress.find()
            .populate("student", "name email")
            .populate("completedExperiments", "title experiment_id")
            .sort({ totalCompleted: -1 });

        res.status(200).json({ count: allProgress.length, progress: allProgress });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch all progress", error: error.message });
    }
};
