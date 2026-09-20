require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const mainRouter = require("./routes/main.router.js");
const errorHandler = require("./middleware/errorHandler.js");

// Check if CLI command was passed directly to index.js (backward compatibility)
const cliCommands = ["init", "add", "commit", "push", "pull", "revert"];
const userArg = process.argv[2];

if (userArg && cliCommands.includes(userArg)) {
    require("./cli.js");
} else if (require.main === module) {
    startServer();
}

function createApp() {
    const app = express();

    // Security Headers & Cross-Origin Resource Sharing
    app.use(helmet());
    app.use(
        cors({
            origin: [
                process.env.FRONTEND_URL || "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
            ],
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
        })
    );

    // Logging & Request Parsing
    if (process.env.NODE_ENV !== "test") {
        app.use(morgan("tiny"));
    }
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Mount Main Routes (both root and /api for backward and forward compatibility)
    app.use("/api", mainRouter);
    app.use("/", mainRouter);

    // Centralized Error Handling Middleware (must be registered after all routes)
    app.use(errorHandler);

    return app;
}

function startServer() {
    const app = createApp();
    const PORT = process.env.PORT || 3000;

    // Database Connection
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/codehub";
    mongoose
        .connect(mongoURI)
        .then(() => console.log("MongoDB Connected Successfully!"))
        .catch((err) => console.error("MongoDB Connection Error: ", err.message));

    // HTTP & Socket.IO Server Setup
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        socket.on("joinRoom", (userID) => {
            socket.join(userID);
            console.log(`User ${userID} connected to room.`);
        });
    });

    httpServer.listen(PORT, () => {
        console.log(`🚀 CodeHub Server running on PORT ${PORT}`);
    });

    return { app, httpServer };
}

module.exports = { createApp, startServer };