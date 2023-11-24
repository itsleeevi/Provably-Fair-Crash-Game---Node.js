const { includesUser } = require("../utils/utils"); // Assuming this is a utility function you have
const { web3Polygon } = require("./web3");
const { insertBet, queryBetAmount, updateBet } = require("./bets");
const { updatePlayerBalance, queryBalance } = require("./players");

module.exports = (io, gameContext) => {
  io.on("connection", (socket) => {
    socket.on("resultTableUserData", (receivedUserData) => {
      if (includesUser(gameContext.resultTableArray, receivedUserData.user)) {
        gameContext.resultTableArray = gameContext.resultTableArray.filter(
          (item) => item.name !== receivedUserData.name
        );
      }
      gameContext.resultTableArray.push(receivedUserData);
      io.sockets.emit("everyPlayer", gameContext.resultTableArray);
    });
    socket.emit("everyPlayer", gameContext.resultTableArray);

    socket.on("messaging", (receivedMessage) => {
      gameContext.latestChatMessages.push(receivedMessage);
      io.sockets.emit("messaging", receivedMessage);
    });

    socket.on("currentBets", async (receivedMessage) => {
      try {
        if (
          receivedMessage.address.toLowerCase() ===
          web3Polygon.eth.accounts
            .recover(gameContext.signatureMessage, receivedMessage.signature)
            .toLowerCase()
        ) {
          if (await addBet(receivedMessage.address, receivedMessage.bet))
            gameContext.currentBets.push(receivedMessage);
        }
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("cashout", async (receivedMessage) => {
      try {
        if (
          receivedMessage.address.toLowerCase() ===
          web3Polygon.eth.accounts
            .recover(gameContext.signatureMessage, receivedMessage.signature)
            .toLowerCase()
        ) {
          await cashOut(receivedMessage.address, receivedMessage.multiplier);
        }
      } catch (err) {
        console.log(err);
      }
    });

    // Emitting the current state and other relevant game information to the connected client
    socket.emit("currentState", gameContext.state);

    if (gameContext.roundStartTimes.length > 0) {
      // Start data includes hashed server seed and hashed crash point
      socket.emit("startData", {
        startTime:
          gameContext.roundStartTimes[gameContext.roundStartTimes.length - 1],
        hashedServerSeed: gameContext.hashedServerSeed,
        hashedCrashPoint: gameContext.hashedCrashPoint,
      });
    }
    socket.emit("chartArray", gameContext.chartArray);
    // Emit the latest chart data point for a new connection
    if (gameContext.chartArray.length > 0) {
      const lastChartPoint =
        gameContext.chartArray[gameContext.chartArray.length - 1];
      socket.emit("newChartPoint", lastChartPoint);
    }

    // Emit other relevant data based on game state
    if (gameContext.crashedStartDate) {
      socket.emit("endData", gameContext.crashedStartDate);
    }

    if (gameContext.bettingTimeout) {
      socket.emit("bettingTime", Date(gameContext.bettingTimeout));
    }

    if (gameContext.sendTime) {
      socket.emit("gameStartTime", gameContext.sendTime);
    }
  });

  const addBet = async (player, betAmount) => {
    const gameBalance = await queryBalance(player);
    const newBalance = Number(gameBalance) - Number(betAmount);
    if (newBalance < 0) {
      io.emit("bet-confirmation", {
        success: false,
        address: player,
      });
      return false;
    }
    await updatePlayerBalance(player, newBalance).then(async (success) => {
      if (await success) {
        if (
          await insertBet(
            gameContext.currentRoundStartTime,
            Date.now(),
            player,
            Number(betAmount),
            null,
            null
          )
        ) {
          io.emit("bet-confirmation", {
            success: true,
            address: player,
            balance: newBalance,
          });
          return true;
        } else {
          await updatePlayerBalance(player, gameBalance);
          io.emit("bet-confirmation", {
            success: false,
            address: player,
          });
        }
      } else {
        io.emit("bet-confirmation", {
          success: false,
          address: player,
        });
        return false;
      }
    });
  };

  const cashOut = async (player, multiplier) => {
    const betAmount = await queryBetAmount(
      gameContext.currentRoundStartTime,
      player
    );

    const gameBalance = await queryBalance(player);
    const prize = (Number(betAmount) * Number(multiplier)).toFixed(2);
    const newBalance = Number(gameBalance) + Number(prize);

    await updatePlayerBalance(player, newBalance).then(async (success) => {
      if (await success) {
        if (
          await updateBet(
            gameContext.currentRoundStartTime,
            player,
            Number(multiplier),
            prize
          )
        )
          io.emit("cashout-confirmation", {
            success: true,
            address: player,
            balance: newBalance,
            multiplier: multiplier,
            prize: prize,
          });
        else {
          await updatePlayerBalance(player, gameBalance);
          io.emit("cashout-confirmation", {
            success: false,
            address: player,
          });
        }
      } else
        io.emit("bet-confirmation", {
          success: false,
          address: player,
        });
    });
  };
};
