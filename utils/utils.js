const crypto = require("crypto");
const { updateRound } = require("../service/history");

function generateServerSeed() {
  return crypto.randomBytes(32).toString("hex");
}

function hashServerSeed(seed) {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function calculateCrashPoint(serverSeed, nonce, maxMultiplier) {
  // Combine the server seed and nonce for hashing
  const combinedSeed = `${serverSeed}-${nonce}`;
  const hash = crypto.createHash("sha256").update(combinedSeed).digest("hex");

  // Use a portion of the hash (first 8 characters) and convert it to an integer
  const int = parseInt(hash.substr(0, 8), 16);

  // Use the formula to calculate crash point with a house edge of 1%
  // 2 ** 32 / (int + 1) gives a raw crash point
  // Multiplying by (1 - houseEdge) applies the house edge
  const houseEdge = 0.01;
  let crashPoint = (2 ** 32 / (int + 1)) * (1 - houseEdge);

  // Ensure the crash point is within the range [1, maxMultiplier]
  crashPoint = Math.max(1, Math.min(crashPoint, maxMultiplier));

  return crashPoint.toFixed(2);
}

function growthFunction(ms) {
  return 0.005 * ms;
}

async function startTicking(gameContext, io, crash) {
  const tickInterval = setInterval(async () => {
    const elapsed = new Date() - gameContext.startTime;
    gameContext.tick = elapsed / 100;

    if (gameContext.state === "PLAYING") {
      if (gameContext.chartArray.length === 0)
        gameContext.chartArray.push({ x: 0, y: 1 });

      const newX = growthFunction(gameContext.tick);
      const newY = Math.exp(growthFunction(gameContext.tick));
      const newPoint = { x: newX, y: newY };

      gameContext.chartArray.push(newPoint);
      io.emit("newChartPoint", newPoint);

      // Check if the newY value has reached or exceeded the crash point
      if (newY >= gameContext.crashPoint) {
        gameContext.state = "CRASHED";
        io.emit("currentState", gameContext.state);
        io.emit("crashEvent", gameContext.crashPoint);

        await updateRound(
          gameContext.currentRoundStartTime,
          gameContext.serverSeed,
          gameContext.nonce,
          gameContext.crashPoint
        );

        clearInterval(tickInterval); // Stop the ticking
        crash(gameContext, io); // Handle the crash
      }
    }
  }, 1000 / 25); // Tick 25 times per second
}

function includesUser(array, user) {
  for (var i = 0; i < array.length; i++) {
    if (array[i].user === user) {
      return true;
    }
  }
  return false;
}

module.exports = {
  calculateCrashPoint,
  growthFunction,
  startTicking,
  generateServerSeed,
  hashServerSeed,
  includesUser,
};
