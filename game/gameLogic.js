const {
  calculateCrashPoint,
  startTicking,
  generateServerSeed,
  hashServerSeed,
} = require("../utils/utils");
const { insertRound } = require("../service/history");
const { getBalanceOfContract } = require("../service/web3");
const { sumBalances } = require("../service/players");

module.exports = function (io, gameContext) {
  function startGameLoop() {
    switch (gameContext.state) {
      case "BETTING":
        // Betting time is finished, start playing
        setTimeout(startPlaying, gameContext.bettingTimeout);
        break;
      case "PLAYING":
        // No need to set a timeout for crashing in the "PLAYING" state,
        // as the crash will be handled by the startTicking function.
        break;
      case "CRASHED":
        // Game has crashed, wait for a while and then start betting
        setTimeout(startBetting, gameContext.crashedTimeout);
        break;
    }
  }

  async function startBetting() {
    gameContext.currentBets = [];
    gameContext.resultTableArray = [];
    io.emit("everyPlayer", gameContext.resultTableArray);
    gameContext.serverSeed = generateServerSeed();
    gameContext.hashedServerSeed = hashServerSeed(gameContext.serverSeed);
    gameContext.nonce =
      gameContext.nonce !== undefined ? gameContext.nonce + 1 : 1; // Increment nonce each round

    // Calculate crash point using server seed and nonce
    const contractBalance = await getBalanceOfContract(
      gameContext.contractPolygon
    );
    const totalBalance = await sumBalances();

    gameContext.maxCrashPoint = Number(contractBalance / totalBalance).toFixed(
      2
    );
    gameContext.crashPoint = calculateCrashPoint(
      gameContext.serverSeed,
      gameContext.nonce,
      gameContext.maxCrashPoint
    );

    if (gameContext.maxCrashPoint > 1) {
      gameContext.currentRoundStartTime = Date.now();

      await insertRound(
        gameContext.currentRoundStartTime,
        gameContext.hashedServerSeed,
        null,
        null,
        null,
        gameContext.maxCrashPoint
      );

      // Emit hashed server seed for the upcoming round
      io.emit("hashedServerSeed", gameContext.hashedServerSeed);

      gameContext.state = "BETTING";
      gameContext.chartArray = [];
      gameContext.tick = 0;
      gameContext.resultTableArray = [];
      gameContext.sendTime = Date.now() + gameContext.bettingTimeout;

      io.emit("currentState", gameContext.state);
      io.emit("gameStartTime", gameContext.sendTime);
    } else {
      gameContext.state = "CRASHED";
    }

    startGameLoop();
  }

  async function startPlaying() {
    if (gameContext.maxCrashPoint > 1) {
      gameContext.state = "PLAYING";
      gameContext.startTime = Date.now();
      gameContext.roundStartTimes.push(Date(gameContext.startTime));

      io.emit("currentState", gameContext.state);
      startTicking(gameContext, io, crash); // Handle the real-time progression
    } else {
      gameContext.state = "BETTING";
    }

    // Continue with the game loop
    startGameLoop();
  }

  function crash(gameContext, io) {
    gameContext.chartArray = [];

    // Continue with the game loop for next round
    startGameLoop();
  }

  // Start the game loop initially
  startGameLoop();
};
