const express = require("express");
const router = express.Router();
const { getHistory } = require("../controllers/history");

router.post("/history", getHistory);

module.exports = router;
