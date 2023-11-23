const models = require("../models");

const insertPlayer = async (address, balance) => {
  return await models.players
    .create({
      address: address,
      balance: balance,
    })
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
};

const updatePlayerUsername = async (address, username) => {
  try {
    const player = await models.players.findOne({
      where: { address: address },
    });

    if (player) {
      await player.update({
        username: username,
      });

      return true;
    } else if (!player) {
      await models.players
        .create({
          address: address,
          username: username,
        })
        .then(() => {
          return true;
        })
        .catch(() => {
          return false;
        });
    } else {
      return false;
    }
  } catch (error) {
    // Error handling
    console.log(error);
    return false;
  }
};

const updatePlayerBalance = async (address, balance) => {
  try {
    const player = await models.players.findOne({
      where: { address: address },
    });

    if (player) {
      await player.update({
        balance: balance,
      });

      return true;
    } else if (!player) {
      await models.players
        .create({
          address: address,
          balance: balance,
        })
        .then(() => {
          return true;
        })
        .catch(() => {
          return false;
        });
    } else {
      return false;
    }
  } catch (error) {
    // Error handling
    console.log(error);
    return false;
  }
};

const queryUsername = async (address) => {
  return await models.players
    .findOne({
      where: {
        address: address, // Your condition
      },
    })
    .then(async (result) => {
      //console.log("result: ", result);
      //console.log("result.dataValues.username: ", result.dataValues.username);
      if (await result) return await result.dataValues.username;
      else return null;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

const queryBalance = async (address) => {
  return await models.players
    .findOne({
      attributes: ["balance"], // Selects only the username column
      where: {
        address: address, // Your condition
      },
    })
    .then(async (result) => {
      if (await result) return result.dataValues.balance;
      else return 0;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

const countAddress = async (address) => {
  return await models.players
    .count({
      where: {
        address: address,
      },
    })
    .then(async (count) => {
      return await count;
    })
    .catch((err) => {
      console.error("Error: ", err);
      return false;
    });
};

const sumBalances = async () => {
  return await models.players
    .sum("balance")
    .then(async (totalBalance) => {
      console.log("totalBalance: ", totalBalance);
      return await totalBalance;
    })
    .catch((err) => {
      console.error("Error: ", err);
      return false;
    });
};

module.exports = {
  insertPlayer,
  updatePlayerUsername,
  updatePlayerBalance,
  queryUsername,
  countAddress,
  queryBalance,
  sumBalances,
};
