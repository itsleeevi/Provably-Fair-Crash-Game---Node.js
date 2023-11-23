const { queryLatestHistory } = require("../service/history");

const getHistory = async (req, res) => {
  try {
    const rounds = await queryLatestHistory();

    res.json({
      rounds: rounds,
      message: "Successful latest rounds query.",
    });
  } catch (err) {
    console.log(err);

    res.json({
      rounds: null,
      message: "Failed latest rounds query.",
    });
  }
};

module.exports = { getHistory };
