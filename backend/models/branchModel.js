const mongoose = require("mongoose");
const { Schema } = mongoose;

const BranchSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        repository: {
            type: Schema.Types.ObjectId,
            ref: "Repository",
            required: true,
            index: true,
        },
        commitSha: {
            type: String,
            default: "",
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

// Branch name must be unique within a repository
BranchSchema.index({ repository: 1, name: 1 }, { unique: true });

const Branch = mongoose.model("Branch", BranchSchema);
module.exports = Branch;
