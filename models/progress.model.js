const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        completedExperiments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Experiment",
            },
        ],
        totalCompleted: {
            type: Number,
            default: 0,
        },
        badge: {
            type: String,
            default: "Beginner Scientist",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Progress", progressSchema);
