const mongoose = require("mongoose");
const { Schema } = mongoose;

const RepositorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            default: "",
            maxlength: 500,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Visibility: true = Public, false = Private (compatible with existing code)
        visibility: {
            type: Boolean,
            default: true,
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
        defaultBranch: {
            type: String,
            default: "main",
        },
        // Kept for backward compatibility with existing code
        content: [
            {
                type: String,
            },
        ],
        issues: [
            {
                type: Schema.Types.ObjectId,
                ref: "Issue",
            },
        ],
        stars: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        starsCount: {
            type: Number,
            default: 0,
        },
        watchers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        watchersCount: {
            type: Number,
            default: 0,
        },
        forkedFrom: {
            type: Schema.Types.ObjectId,
            ref: "Repository",
            default: null,
        },
        forksCount: {
            type: Number,
            default: 0,
        },
        topics: [
            {
                type: String,
                trim: true,
            },
        ],
        collaborators: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
                role: {
                    type: String,
                    enum: ["read", "write", "admin"],
                    default: "write",
                },
            },
        ],
    },
    { timestamps: true }
);

// Compound Unique Index: owner + repo name (Allows different users to have a repo with the same name)
RepositorySchema.index({ owner: 1, name: 1 }, { unique: true });
RepositorySchema.index({ visibility: 1, createdAt: -1 });

// Ensure isPrivate and visibility stay synchronized before saving
RepositorySchema.pre("save", function () {
    if (this.isModified("visibility") && !this.isModified("isPrivate")) {
        this.isPrivate = !this.visibility;
    } else if (this.isModified("isPrivate") && !this.isModified("visibility")) {
        this.visibility = !this.isPrivate;
    }
});

const Repository = mongoose.model("Repository", RepositorySchema);
module.exports = Repository;