const crypto = require("crypto");
const { updateRound } = require("../service/history");

function generateServerSeed() {
  return crypto.randomBytes(32).toString("hex");
}

function hashServerSeed(seed) {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function calculateCrashPoint(serverSeed, nonce, maxMultiplier) {
  // Hash the combined server seed and nonce
  const hash = crypto
    .createHash("sha256")
    .update(`${serverSeed}-${nonce}`)
    .digest("hex");

  // Convert the hash to a number in the range [0, 1)
  const hashFraction = parseInt(hash.slice(0, 10), 16) / 0xffffffffff;

  // Scale the hash fraction to the range [1, maxMultiplier]
  let crashPoint = 1 + hashFraction * (maxMultiplier - 1);

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
