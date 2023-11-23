const express = require("express");
const router = express.Router();
const { createMessage, getMessages } = require("../controllers/chat");

router.post("/chat", createMessage);
router.post("/latest-messages", getMessages);

module.exports = router;
