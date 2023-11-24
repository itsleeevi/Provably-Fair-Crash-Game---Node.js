const {
  insertPlayer,
  updatePlayerUsername,
  queryUsername,
  countAddress,
  queryBalance,
} = require("../service/players");

const createPlayer = async (req, res) => {
  const address = req.body.address;

  try {
    if (await insertPlayer(address))
      res.json({
        success: true,
        message: "Successful account creation.",
      });
    else
      res.json({
        success: false,
        message: "Failed to create account.",
      });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,
      message: "Failed to create account.",
    });
  }
};

const addUsername = async (req, res) => {
  const address = req.body.address;
  const username = req.body.username;

  try {
    if (await updatePlayerUsername(address, username))
      res.json({
        success: true,
        message: "Success!",
      });
    else
      res.json({
        success: false,
        message: "Failed!",
      });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,
      message: "Failed to create account.",
    });
  }
};

const getUsername = async (req, res) => {
  const address = req.body.address;

  try {
    const username = await queryUsername(address);

    res.json({
      username: username,
      message: "Successful username query.",
    });
  } catch (err) {
    console.log(err);

    res.json({
      username: null,
      message: "Failed to username query.",
    });
  }
};

const getBalance = async (req, res) => {
  const address = req.body.address;

  try {
    const balance = await queryBalance(address);

    res.json({
      balance: balance,
      message: "Successful balance query.",
    });
  } catch (err) {
    console.log(err);

    res.json({
      balance: null,
      message: "Failed balance query.",
    });
  }
};

const checkUsernameExists = async (req, res) => {
  const address = req.body.address;

  try {
    if (address && (await countAddress(address)) == 0) {
      res.json({
        username: null,
        message: "Username doesn't exist.",
      });
    } else {
      const username = await queryUsername(address);

      if (username !== null)
        res.json({
          username: username,
          message: "Username exists.",
        });
      else
        res.json({
          username: null,
          message: "Username doesn't exist.",
        });
    }
  } catch (err) {
    console.log(err);

    res.json({
      message: "Failed username check.",
    });
  }
};

module.exports = {
  createPlayer,
  addUsername,
  getUsername,
  checkUsernameExists,
  getBalance,
};
