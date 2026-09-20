const searchService = require("../services/searchService");
const { successResponse } = require("../utils/apiResponse");

const globalSearch = async (req, res, next) => {
    try {
        const q = req.query.q || req.query.query || "";
        const type = req.query.type || "all";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;

        const results = await searchService.search(q, { type, page, limit });
        return successResponse(res, 200, "Search results retrieved.", results);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    globalSearch,
};
