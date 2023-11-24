const { queryLatestMessages, insertMessage } = require("../service/chat");

const createMessage = async (req, res) => {
  const username = req.body.username;
  const message = req.body.message;
  const date = Date.now();

  try {
    if (await insertMessage(date, username, message))
      res.json({
        success: true,
        message: "Successful message creation.",
      });
    else
      res.json({
        success: false,
        message: "Failed to create message.",
      });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,
      message: "Failed to create message.",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await queryLatestMessages();

    res.json({
      messages: messages,
      message: "Successful latest messages query.",
    });
  } catch (err) {
    console.log(err);

    res.json({
      messages: null,
      message: "Failed latest messages query.",
    });
  }
};

module.exports = { createMessage, getMessages };
