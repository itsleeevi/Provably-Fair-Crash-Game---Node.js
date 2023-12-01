const models = require("../models");

const insertRound = async (
  date,
  hashedServerSeed,
  serverSeed,
  nonce,
  crashPoint,
  maxMultiplier
) => {
  return await models.history
    .create({
      date: date,
      hashedServerSeed: hashedServerSeed,
      serverSeed: serverSeed,
      nonce: nonce,
      crashPoint: crashPoint,
      maxMultiplier: maxMultiplier,
    })
    .then(() => {
      return true;
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

const updateRound = async (date, serverSeed, nonce, crashPoint) => {
  try {
    // Find the record by date
    const round = await models.history.findOne({ where: { date: date } });

    // Check if the round exists
    if (round) {
      // Update the round's serverSeed, nonce, and crashPoint
      await round.update({
        serverSeed: serverSeed,
        nonce: nonce,
        crashPoint: crashPoint,
      });

      return true;
    } else {
      // If no round is found for the given date
      console.log("No round found for the given date.");
      return false;
    }
  } catch (error) {
    // Error handling
    console.log(error);
    return false;
  }
};

const queryLatestHistory = async () => {
  return await models.history
    .findAll({
      limit: 25, // limits the number of rows returned
      order: [["date", "DESC"]], // orders the rows by date in descending order
    })
    .then(async (rounds) => {
      return await rounds;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

module.exports = { insertRound, updateRound, queryLatestHistory };
