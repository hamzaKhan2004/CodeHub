const mongoose = require("mongoose");
const { Schema } = mongoose;

const CommitSchema = new Schema(
    {
        sha: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        repository: {
            type: Schema.Types.ObjectId,
            ref: "Repository",
            required: true,
            index: true,
        },
        branch: {
            type: String,
            required: true,
            default: "main",
            index: true,
        },
        parentSha: {
            type: String,
            default: null,
        },
        filesChanged: [
            {
                path: { type: String, required: true },
                status: { type: String, enum: ["added", "modified", "deleted"], required: true },
                additions: { type: Number, default: 0 },
                deletions: { type: Number, default: 0 },
                patch: { type: String, default: "" }, // basic diff string
            },
        ],
        stats: {
            totalAdditions: { type: Number, default: 0 },
            totalDeletions: { type: Number, default: 0 },
            filesCount: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

CommitSchema.index({ repository: 1, branch: 1, createdAt: -1 });

const Commit = mongoose.model("Commit", CommitSchema);
module.exports = Commit;
