require("dotenv").config();
const { Web3 } = require("web3");
const CONFIG = require("../config/config.json");
const Crash = require("../artifacts/Crash.json");
const Token = require("../artifacts/wGHOST.json");

const {
  queryBalance,
  queryUsername,
  updatePlayerBalance,
  insertPlayer,
  countAddress,
} = require("../service/players");

const web3Polygon = new Web3(CONFIG.WEB3.NETWORK.POLYGON.WEBSOCKET);
const web3HttpPolygon = new Web3(CONFIG.WEB3.NETWORK.POLYGON.RPC_PUBLIC);

// sending & signing web3 tx
const send = async (web3, signer, transaction) => {
  const options = {
    to: CONFIG.WEB3.NETWORK.POLYGON.CONTRACT_ADDRESS,
    data: transaction.encodeABI(),
    gas: await transaction.estimateGas({ from: signer.address }),
    gasPrice: await web3.eth.getGasPrice(),
    nonce: await web3.eth.getTransactionCount(signer.address, "pending"),
  };
  const signed = await web3.eth.accounts.signTransaction(
    options,
    signer.privateKey
  );
  const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
  return receipt;
};

const getTransactionReceipt = async (transactionHash) => {
  try {
    const receipt = await web3HttpPolygon.eth.getTransactionReceipt(
      transactionHash
    );
    return receipt;
  } catch (error) {
    console.error("Error fetching transaction receipt: ", error);
    throw error; // or handle it as per your application's error handling policy
  }
};

const initContract = async () => {
  try {
    const contractPolygon = await new web3Polygon.eth.Contract(
      Crash,
      CONFIG.WEB3.NETWORK.POLYGON.CONTRACT_ADDRESS
    );
    const contractHttpPolygon = await new web3HttpPolygon.eth.Contract(
      Crash,
      CONFIG.WEB3.NETWORK.POLYGON.CONTRACT_ADDRESS
    );

    return {
      contractPolygon,
      contractHttpPolygon,
    };
  } catch (err) {
    console.log(err);
  }
};

const initSigner = async () => {
  const signer = await web3HttpPolygon.eth.accounts.privateKeyToAccount(
    process.env.VALIDATOR_PRIVATE_KEY
  );
  await web3HttpPolygon.eth.accounts.wallet.add(signer);

  return await signer;
};

const initializeDepositEventListener = async (contractWs, io) => {
  await contractWs.events.Deposit({}).on("data", async (event) => {
    let depositProcessingPromise = Promise.resolve();
    await handleDepositEvent(event, depositProcessingPromise, io);
  });
};

const initializeWithdrawEventListener = async (
  contractWs,
  io,
  signer,
  contractHttpPolygon
) => {
  await contractWs.events.WithdrawRequest({}).on("data", async (event) => {
    let withdrawProcessingPromise = Promise.resolve();
    await handleWithdrawEvent(
      event,
      withdrawProcessingPromise,
      io,
      signer,
      contractHttpPolygon
    );
  });
};

const handleDepositEvent = async (event, processingPromise, io) => {
  try {
    await processingPromise;
    const receipt = await getTransactionReceipt(event.transactionHash);
    if (receipt) {
      if ((await countAddress(event.returnValues.player)) > 0) {
        const gameBalance = await queryBalance(event.returnValues.player);
        const newBalance =
          Number(gameBalance) +
          Number(
            web3HttpPolygon.utils.fromWei(
              event.returnValues.amount.toString(),
              "ether"
            )
          );

        await updatePlayerBalance(event.returnValues.player, newBalance).then(
          (success) => {
            if (success)
              io.emit("deposit", {
                success: true,
                address: event.returnValues.player,
                balance: newBalance,
              });
            else
              io.emit("deposit", {
                success: false,
                address: event.returnValues.player,
              });
          }
        );
      } else {
        const newBalance = Number(
          web3HttpPolygon.utils.fromWei(
            event.returnValues.amount.toString(),
            "ether"
          )
        );
        if (await insertPlayer(event.returnValues.player, newBalance))
          io.emit("deposit", {
            success: true,
            address: event.returnValues.player,
            balance: newBalance,
          });
        else
          io.emit("deposit", {
            success: false,
            address: event.returnValues.player,
          });
      }
    } else
      io.emit("deposit", {
        success: false,
        address: event.returnValues.player,
      });
  } catch (error) {
    console.error("Error in handleDepositEvent: ", error);
  } finally {
    processingPromise = Promise.resolve();
  }
};

const handleWithdrawEvent = async (
  event,
  processingPromise,
  io,
  signer,
  contractHttpPolygon
) => {
  try {
    await processingPromise;
    const receipt = await getTransactionReceipt(event.transactionHash);

    if (receipt) {
      const gameBalance = await queryBalance(event.returnValues.player);
      const newBalance =
        Number(gameBalance) -
        Number(
          web3HttpPolygon.utils.fromWei(
            event.returnValues.amount.toString(),
            "ether"
          )
        );

      const tx = contractHttpPolygon.methods.validateWithdraw(
        event.returnValues.player,
        event.returnValues.amount
      );

      let validateWithdrawPromise = Promise.resolve();
      try {
        await validateWithdrawPromise;
        await send(web3HttpPolygon, signer, tx).then(
          async (validateWithdrawReceipt) => {
            if (await validateWithdrawReceipt) {
              await updatePlayerBalance(
                event.returnValues.player,
                newBalance
              ).then((success) => {
                if (success)
                  io.emit("withdraw", {
                    success: true,
                    address: event.returnValues.player,
                    balance: newBalance,
                  });
                else
                  io.emit("withdraw", {
                    success: false,
                    address: event.returnValues.player,
                  });
              });
            }
          }
        );
      } catch (err) {
        console.log(err);
      } finally {
        validateWithdrawPromise = Promise.resolve();
      }
    } else
      io.emit("withdraw", {
        success: false,
        address: event.returnValues.player,
      });
  } catch (error) {
    console.error("Error in handleWithdrawEvent: ", error);
  } finally {
    processingPromise = Promise.resolve();
  }
};

const getBalanceOfContract = async (contractWs) => {
  try {
    const contractWs = (await initContract()).contractPolygon;
    const balance = await contractWs.methods.getBalance().call();
    return Number(web3HttpPolygon.utils.fromWei(balance.toString(), "ether"));
  } catch (err) {
    console.log(err);
    return null;
  }
};

module.exports = {
  send,
  getTransactionReceipt,
  initContract,
  initializeDepositEventListener,
  initializeWithdrawEventListener,
  handleDepositEvent,
  handleWithdrawEvent,
  web3HttpPolygon,
  web3Polygon,
  initSigner,
  getBalanceOfContract,
};
