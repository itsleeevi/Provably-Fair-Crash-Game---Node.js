const models = require("../models");

const insertMessage = async (date, username, message) => {
  return await models.chat
    .create({
      date: date,
      username: username,
      message: message,
    })
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
};

const queryLatestMessages = async () => {
  return await models.chat
    .findAll({
      limit: 50, // limits the number of rows returned
      order: [["date", "DESC"]], // orders the rows by date in descending order
    })
    .then(async (chats) => {
      return await chats;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

module.exports = { insertMessage, queryLatestMessages };
