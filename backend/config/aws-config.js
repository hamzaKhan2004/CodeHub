require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const AWS = require("aws-sdk");

AWS.config.update({
    region: process.env.AWS_REGION || "eu-north-1",
});

const s3 = new AWS.S3();

const S3_BUCKET = "mygitfirstbucket";

module.exports = { s3, S3_BUCKET };