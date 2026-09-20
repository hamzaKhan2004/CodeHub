const express = require("express");
const searchController = require("../controllers/searchController");

const searchRouter = express.Router();

searchRouter.get("/search", searchController.globalSearch);

module.exports = searchRouter;
