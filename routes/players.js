const express = require("express");
const router = express.Router();
const {
  createPlayer,
  addUsername,
  getUsername,
  checkUsernameExists,
  getBalance,
} = require("../controllers/players");

router.post("/create", createPlayer);
router.post("/add-username", addUsername);
router.post("/check", checkUsernameExists);
router.post("/username", getUsername);
router.post("/balance", getBalance);

module.exports = router;
