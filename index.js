require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mysql = require("mysql");
const cors = require("cors");
const { Web3 } = require("web3");
const WebSocket = require("ws");
const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: "*" } });

const db = require("./models");
const {
  initContract,
  initializeDepositEventListener,
  initializeWithdrawEventListener,
  web3HttpPolygon,
  web3Polygon,
  initSigner,
  getBalanceOfContract,
} = require("./service/web3");
const { sumBalances } = require("./service/players");

// Routes setup
const chatRoutes = require("./routes/chat");
const historyRoutes = require("./routes/history");
const playersRoutes = require("./routes/players");

app.use(cors());
app.use(express.json());
app.use(chatRoutes);
app.use(historyRoutes);
app.use(playersRoutes);

const gameContext = {
  state: "CRASHED", // 'BETTING', 'PLAYING', 'CRASHED'
  crashedTimeout: 3000,
  bettingTimeout: 15000,
  playingTimeout: 5000,
  currentRoundStartTime: null, // time when betting starts of new round
  crashedStartDate: null,
  startTime: null,
  roundStartTimes: [],
  sendTime: null,
  tick: 0, // tick of the chart
  resultTableArray: [], // array of objects with result table data
  chartArray: [], // values for chart
  serverSeed: null,
  hashedServerSeed: null,
  nonce: null,
  latestChatMessages: [],
  currentBets: [],
  signatureMessage:
    "This signature is required so the server can verify that you are the one who is placing bets and receiving payouts. Thank you!",
  maxCrashPoint: null,
};

// Socket setup
require("./service/socketService")(io, gameContext);

// Time sync setup
setInterval(() => {
  io.sockets.emit("serverTime", Date.now());
}, 1000);

// Game logic setup
require("./game/gameLogic")(io, gameContext);

const port = process.env.PORT || 3003;
//const portHttps = process.env.PORT || PORT_HTTPS;

db.sequelize
  .sync()
  .then(async () => {
    const contractPolygon = (await initContract()).contractPolygon;
    const contractHttpPolygon = (await initContract()).contractHttpPolygon;
    const signer = await initSigner();
    await initializeDepositEventListener(contractPolygon, io);
    await initializeWithdrawEventListener(
      contractPolygon,
      io,
      signer,
      contractHttpPolygon
    );

    server.listen(port, async () => {
      console.log(`Server running on port ${port}.`);
    });
    /*
  httpsServer.listen(portHttps, async () => {
    console.log(`Server running on port ${portHttps}.`);
  });*/
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err);
  });
