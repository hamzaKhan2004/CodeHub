require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const http = require("http");
const yargs = require("yargs");
const { Server } = require("socket.io");


const { hideBin } = require("yargs/helpers");

const { initRepo } = require("./controllers/init.js");
const { addRepo } = require("./controllers/add.js");
const { commitRepo } = require("./controllers/commit.js");
const { pushRepo } = require("./controllers/push.js");
const { pullRepo } = require("./controllers/pull.js");
const { revertRepo } = require("./controllers/revert.js");
const mainRouter = require("./routes/main.router.js");


yargs(hideBin(process.argv))
    .command("start", "Start a new server", {}, startServer)
    .command("init", "Initialise a new repository", {}, initRepo)
    .command("add <file>", "Add a file to the repository", (yargs) => {
        yargs.positional("file", {
            describe: "File to add to the staging area",
            type: "string",
        });
    }, (argv) => {
        addRepo(argv.file);
    })
    .command("commit <message>", "Commit the staged files", (yargs) => {
        yargs.positional("message", {
            describe: "Commit message",
            type: "string",
        });
    }, (argv) => commitRepo(argv.message))
    .command("push", "Push commits to S3", {}, pushRepo)
    .command("pull", "Pull commits from S3", {}, pullRepo)
    .command("revert <commitID>", "Revert to a specific commit", (yargs) => {
        yargs.positional("commitID", {
            describe: "Commit ID to revert to",
            type: "string"
        })
    }, (argv) => revertRepo(argv.commitID))
    .demandCommand(1, "You need at least one command")
    .help().argv;


function startServer() {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(bodyParser.json());
    app.use(express.json());
    app.use(morgan('tiny'));

    app.use(cors({ origin: "*" }));

    const mongodURI = process.env.MONGODB_URI;

    mongoose.connect(mongodURI)
        .then(() => console.log("MongoDB Connected!"))
        .catch((err) => console.log("Unable to connect : ", err))


    let user = "test";

    app.use("/", mainRouter)

    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        }
    });

    io.on("connection", (socket) => {
        socket.on("joinRoom", (userID) => {
            user = userID;
            console.log("======");
            console.log(user);
            console.log("======");
            console.log(userID);

        });
    })

    const db = mongoose.connection;

    db.once("open", async () => {
        console.log("CRUD operations called");
        //CRUD Operations
    })

    httpServer.listen(PORT, () => {
        console.log(`Server is running on PORT ${PORT}`);

    })

}