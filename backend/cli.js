#!/usr/bin/env node
require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const { initRepo } = require("./controllers/init.js");
const { addRepo } = require("./controllers/add.js");
const { commitRepo } = require("./controllers/commit.js");
const { pushRepo } = require("./controllers/push.js");
const { pullRepo } = require("./controllers/pull.js");
const { revertRepo } = require("./controllers/revert.js");

yargs(hideBin(process.argv))
    .scriptName("mygit")
    .usage("$0 <command> [options]")
    .command(
        "init [repo]",
        "Initialise a new repository",
        (yargs) => {
            yargs.positional("repo", {
                describe: "Repository in owner/repo format (optional)",
                type: "string",
            });
        },
        (argv) => initRepo(argv.repo)
    )
    .command(
        "add [file]",
        "Add file(s) to the staging area",
        (yargs) => {
            yargs.positional("file", {
                describe: "File to add to the staging area (use '.' for all)",
                type: "string",
                default: ".",
            });
        },
        (argv) => {
            addRepo(argv.file);
        }
    )
    .command(
        "commit [message]",
        "Commit the staged files",
        (yargs) => {
            yargs
                .positional("message", {
                    describe: "Commit message",
                    type: "string",
                })
                .option("m", {
                    alias: "message-opt",
                    describe: "Commit message",
                    type: "string",
                });
        },
        (argv) => {
            const msg = argv.message || argv.m || argv["message-opt"];
            if (!msg) {
                console.error("Error: commit message is required. Usage: mygit commit <message> or mygit commit -m <message>");
                process.exit(1);
            }
            commitRepo(msg);
        }
    )
    .command(
        "push [remote] [branch]",
        "Push commits to S3",
        {},
        (argv) => pushRepo(argv.remote, argv.branch)
    )
    .command(
        "pull [remote] [branch]",
        "Pull commits from S3",
        {},
        (argv) => pullRepo(argv.remote, argv.branch)
    )
    .command(
        "revert <commitID>",
        "Revert to a specific commit",
        (yargs) => {
            yargs.positional("commitID", {
                describe: "Commit ID to revert to",
                type: "string",
            });
        },
        (argv) => revertRepo(argv.commitID)
    )
    .demandCommand(1, "You need at least one command")
    .help().argv;
