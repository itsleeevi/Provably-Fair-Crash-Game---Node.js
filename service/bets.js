const models = require("../models");

const insertBet = async (
  roundDate,
  date,
  address,
  bet,
  exitMultiplier,
  prize
) => {
  return await models.bets
    .create({
      roundDate: roundDate,
      date: date,
      address: address,
      bet: bet,
      exitMultiplier: exitMultiplier,
      prize: prize,
    })
    .then(() => {
      return true;
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

const updateBet = async (roundDate, address, exitMultiplier, prize) => {
  try {
    // Find the record by date and address
    const bet = await models.bets.findOne({
      where: { roundDate: roundDate, address: address },
    });

    // Check if the bet exists
    if (bet) {
      await bet.update({
        exitMultiplier: exitMultiplier,
        prize: prize,
      });

      return true;
    } else {
      // If no bet is found for the given date and address
      console.log("No bet found for the given date and address.");
      return false;
    }
  } catch (error) {
    // Error handling
    console.log(error);
    return false;
  }
};

const queryBetAmount = async (roundDate, address) => {
  return await models.bets
    .findOne({
      attributes: ["bet"],
      where: {
        roundDate: roundDate,
        address: address,
      },
    })
    .then(async (result) => {
      if (await result) return result.dataValues.bet;
      else return 0;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

module.exports = { insertBet, updateBet, queryBetAmount };
