// /sapi/v1/capital/config/getall
import axios from "axios";
import fs from "fs";
import WebSocket from "ws";
import dotenv from "dotenv";
import crypto from "crypto";
import qs from "qs";
import { sendEmail, sendErrorEmail } from "./sendEmail.js";
import {
    BuyMovements,
    SellMovements,
    LastBtcBuyTable,
    Balances,
    BotState,
} from "../models/model.js";
import { getAccountBalance } from "../trader/account.js";
import { seedDb } from "../helpers/seed.js";

dotenv.config();

// Read the version from the text file and store it in a variable
let version;
fs.readFile("version.txt", "utf8", (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    version = data.trim(); // Remove any leading/trailing whitespace
});

const streamUrl = "wss://stream.binance.com:9443/ws";
const baseUrl = "https://api.binance.com";
// const baseUrl = "https://testnet.binance.vision";
const { APIKEY, SECRET } = process.env;

let lastBuyPrice = 0;

// this variable has to keep track of the total btc we bought, cause we calculate the 12.5 % of this total every time we try to sell.
// when we buy, we overwrite this variable with the amount of btc we bought PLUS what we had when we bought.
let lastBuyBTCTotal = 0;

let itsTimeToBuyOrSell = true;

let averageSellPrice = 0;
let lastSellPrice = 0;
let btcBalance = 0;
let usdtBalance = 0;
let myBalance = {};

let actionInProgress = false;

// global variable to check if the bot is started or not
global.isStarted = false;

async function refreshParameters(nodeEnv) {
    myBalance = await getAccountBalance();

    // set the btc and usdt balance
    btcBalance = +myBalance.BTC;
    usdtBalance = +myBalance.USDT;

    if (!usdtBalance) usdtBalance = 0;
    if (!btcBalance) btcBalance = 0;

    // get the last sell price from the db
    try {
        const averageSell = await SellMovements.findAll({});
        const lastInsertedSell = await SellMovements.findOne({
            order: [["timestamp", "DESC"]],
            limit: 1,
        });
        console.log(averageSell);
        console.log("---------------------");
        console.log(lastInsertedSell);
        lastSellPrice = +lastInsertedSell.price;

        let sellPrices = averageSell.map((movement) => movement.price);
        let sum = sellPrices.reduce((a, b) => +a + +b, 0);
        averageSellPrice = sum / sellPrices.length;
    } catch (err) {
        console.log(err);
        averageSellPrice = 0;
        lastSellPrice = 0;
    }

    if (!averageSellPrice) averageSellPrice = 0;

    if (!lastSellPrice) lastSellPrice = 0;

    // get the last buy price from the db
    try {
        const lastBuy = await BuyMovements.findOne({
            order: [["timestamp", "DESC"]],
            limit: 1,
        });
        lastBuyPrice = +lastBuy.price;
    } catch (error) {
        console.log(error);
        lastBuyPrice = 0;
    }
    // set the last buy price
    console.log("lastBuyPrice", lastBuyPrice);

    // get the last buy btc total from the db (this is the amout of btc we bought in the last buy)
    try {
        const lastBuy = await LastBtcBuyTable.findOne({
            order: [["timestamp", "DESC"]],
            limit: 1,
        });
        console.log(lastBuy);
        lastBuyBTCTotal = +lastBuy.lastBuyBtcTot;
    } catch (error) {
        console.log(error);
        lastBuyBTCTotal = 0;
    }
    console.log("lastBuyBTCTotal", lastBuyBTCTotal);
}

/**
 *
 * MAIN
 *
 */

async function main(nodeEnv) {
    console.log("Starting bot...");
    console.log("+----------------------------------+");
    console.log("BTC " + btcBalance);
    console.log("USDT " + usdtBalance);
    console.log("Last buy price" + lastBuyPrice);
    console.log("Average sell price" + averageSellPrice);
    console.log("last Sell Price: " + lastSellPrice);
    console.log("+----------------------------------+");

    let percentageUP = 1.05;
    let percentageDOWN = 0.95;

    // send email every 24h
    setInterval(async () => {
        await sendEmail(
            "UPDATE",
            btcBalance,
            usdtBalance,
            Date.now(),
            0,
            0,
            0,
            1,
            isStarted
        );
    }, 86400000);

    // set lastAction time to 4 hours ago, this way as soon as we start the bot, it will start doing an action.
    let lastActionTime = new Date().getTime() - 14410000;

    let remaining = 0;

    // function that every 4 hours of bot uptime, will set the itsTimeToBuyOrSell variable to true for 1 minute, and then again to false
    async function setItsTimeToBuyOrSell() {
        let currentTime = new Date().getTime();
        if (currentTime - lastActionTime >= 14400000) {
            // set the itsTimeToBuyOrSell to true
            itsTimeToBuyOrSell = true;
            lastActionTime = currentTime;
            // save in logs that at this time, the itsTimeToBuyOrSell was set to true
            let tims = Date.now();
            fs.appendFile(
                "log.txt",
                `${new Date(
                    tims
                ).toLocaleString()} - itsTimeToBuyOrSell was set to true\n`,
                function (err) {
                    if (err) throw err;
                }
            );
            // in 1 minute set the itsTimeToBuyOrSell to false
            setTimeout(() => {
                itsTimeToBuyOrSell = false;
                // save in logs that at this time, the itsTimeToBuyOrSell was set to false
                let tims = Date.now();
                fs.appendFile(
                    "log.txt",
                    `${new Date(
                        tims
                    ).toLocaleString()} - itsTimeToBuyOrSell was set to false\n`,
                    function (err) {
                        if (err) throw err;
                    }
                );
            }, 60000);
        }
        // here calculate in how much time currentTime - lastActionTime >= 21600000 will be true
        remaining = 14400000 - (currentTime - lastActionTime);
        // see time in hours minutes and seconds
        let r = new Date(remaining);
        console.log(
            "Until next action: ",
            r.getHours(),
            r.getMinutes(),
            r.getSeconds()
        );
    }

    // emit the status (start/stop) of the bot every 1 second
    setInterval(async () => {
        io.emit("status", {
            botStatus: isStarted,
            remaining,
            version,
        }),
            1000;
    });

    const wsUrl = `${streamUrl}/btcusdt@kline_1m`;
    let ws;
    let reconnecting = false; // Flag to track if reconnection is already in progress

    // check if binance WS is working or not (if not send an email)
    let wsIsWorking = false;
    let sent = false;
    setInterval(() => {
        if (!wsIsWorking) {
            console.log("WS is not working");
            isStarted = false;
            ws.close();
            // write in logs that the WS is not working
            let tims = Date.now();
            fs.appendFile(
                "log.txt",
                `${new Date(
                    tims
                ).toLocaleString()} - WS is not working, restarting...\n`,
                function (err) {
                    if (err) throw err;
                }
            );
            if (!sent) {
                sendErrorEmail(
                    "The Binance WebSocket is not working, trying to restart it..."
                );
                sent = true;
            }
        }
        wsIsWorking = false;
    }, 10000);

    function openWebSocket() {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("WebSocket connection established.");
            reconnecting = false; // Reset the reconnecting flag
            wsIsWorking = true;
        };

        ws.on("message", async (data) => {
            wsIsWorking = true;
            sent = false;
            if (!actionInProgress) {
                if (!isStarted) return console.log("Stopped");
                const {
                    k: { t: timestamp, o: openPrice },
                } = JSON.parse(data);

                await setItsTimeToBuyOrSell();
                let priceAtWillBuy = averageSellPrice * percentageDOWN;
                let consider = lastSellPrice ? lastSellPrice : lastBuyPrice;

                /**
                 * @var priceAtWillSell
                 * Is the price at which the bot will sell
                 * Is calculated using lastSellPrice if it's not 0
                 * Otherwise it will use lastBuyPrice
                 * In both cases, it's the price * percentageDOWN
                 */
                let priceAtWillSell = consider * percentageUP;

                io.emit("data", {
                    openPrice,
                    lastBuyPrice,
                    averageSellPrice,
                    priceAtWillBuy,
                    priceAtWillSell,
                });

                // if the price is lower than the averageSellPrice * percentageDOWN, buy
                if (+openPrice < averageSellPrice * percentageDOWN) {
                    if (usdtBalance < 5) {
                        console.log("Not enough USDT to buy");
                    } else {
                        // set actionInProgress to true
                        actionInProgress = true;
                        let response = await buyAll(
                            openPrice,
                            percentageDOWN,
                            lastActionTime
                        );
                        if (response == "expired") {
                            console.log("Order expired");
                        }
                        if (response == "ok") {
                            console.log("bought!");
                        }
                    }
                } else {
                    console.log(`Price is too high to Buy: ${openPrice}`);
                }

                if (itsTimeToBuyOrSell) {
                    // if the last sell price is not null, use it, else use the lastBuyPrice -
                    // let's sell using last sell price. Sell if openprice = 12.5% > of the last sell price.
                    // this will use lastBuyPrice if it's the first time the bot is selling after a buy. If it's not the first time, it will use the last sell price
                    // line 281 -> price at will sell

                    // SELL if the price is higher than the last buy price (or averageSellPrice) by at least 5%
                    if (openPrice > priceAtWillSell) {
                        if (btcBalance < 0.0001)
                            return console.log("Not enough BTC to sell");
                        // set actionInProgress to true
                        actionInProgress = true;
                        let res = await sellPercentage(
                            openPrice,
                            percentageUP,
                            lastActionTime
                        );
                        if (res == "expired") {
                            console.log("Order expired");
                        }
                        if (res == "ok") {
                            itsTimeToBuyOrSell = false;
                            // save in logs that at this time, the itsTimeToBuyOrSell was set to false
                            let tims = Date.now();
                            fs.appendFile(
                                "log.txt",
                                `${new Date(
                                    tims
                                ).toLocaleString()} - itsTimeToBuyOrSell was set to false\n`,
                                function (err) {
                                    if (err) throw err;
                                }
                            );
                        }
                    } else {
                        console.log(`Price is too low: ${openPrice}`);
                    }
                }
            }
        });

        ws.on("error", (error) => {
            sendErrorEmail(JSON.stringify(error));
            console.error(error);
        });

        ws.onclose = () => {
            console.log("WebSocket connection closed.");
            if (!reconnecting) {
                reconnecting = true; // Set the reconnecting flag to prevent multiple reconnections
                setTimeout(openWebSocket, 5000); // Reopen the WebSocket after a delay
                setTimeout(() => (isStarted = true), 10000); // Restart the bot
            }
        };
    }

    openWebSocket(); // Start the WebSocket connection
}

/**
 * BUY ALL FUNCTION
 *
 * @param {number} openPrice
 * @param {number} percentage
 * @param {number} lastActionTime
 * @returns "ok" if the order was executed, "expired" if the order expired, "error" if there was an error
 */
async function buyAll(openPrice, percentage, lastActionTime) {
    console.log("Buying...");

    // convert openPrice to a number
    let openPriceNumber = +openPrice;
    const quantityToBuy = usdtBalance / openPriceNumber - 0.000001;

    const truncatedQuantityToBuy = Math.trunc(quantityToBuy * 100000) / 100000;

    const order = {
        symbol: "BTCUSDT",
        side: "BUY",
        type: "LIMIT",
        timeInForce: "FOK",
        price: openPrice,
        quantity: truncatedQuantityToBuy,
        timestamp: Date.now(),
    };
    console.log("order", order);
    const signature = crypto
        .createHmac("sha256", SECRET)
        .update(qs.stringify(order))
        .digest("hex");

    try {
        const response = await axios.post(
            `${baseUrl}/api/v3/order`,
            qs.stringify({
                ...order,
                signature,
            }),
            {
                headers: {
                    "X-MBX-APIKEY": APIKEY,
                },
            }
        );

        // TODO if it returns expired, try again
        if (response.data.status !== "FILLED") {
            console.log("Order not filled");
            if (response.data.status === "EXPIRED") {
                actionInProgress = false;
                return "expired";
            }
            actionInProgress = false;
            return;
        }
        console.log("Order placed successfully at price " + openPrice);

        // save in log file
        let tims = Date.now();
        fs.appendFile(
            "log.txt",
            `${new Date(
                tims
            ).toLocaleString()} - Bougth ${truncatedQuantityToBuy} BTC at price ${openPrice}\n`,
            function (err) {
                if (err) throw err;
                console.log("Saved3!");
            }
        );

        console.log(response.data);

        // set the last buy price to the current price
        lastBuyPrice = openPrice;
        // save the last buy price to the db
        await BuyMovements.create({
            price: openPrice,
            quantity: quantityToBuy.toFixed(5),
            timestamp: Date.now(),
            symbol: "BTCUSDT",
        });

        await SellMovements.destroy({
            where: {},
            truncate: true,
        });

        // set the last action time to the current time
        lastActionTime = new Date().getTime();

        lastBuyBTCTotal = truncatedQuantityToBuy + btcBalance;

        // save last btc buy total to the db
        await LastBtcBuyTable.create({
            lastBuyBtcTot: lastBuyBTCTotal,
            timestamp: Date.now(),
        });

        await refreshParameters();

        // send email
        await sendEmail(
            "Has bought",
            btcBalance,
            usdtBalance,
            Date.now(),
            percentage,
            quantityToBuy.toFixed(5),
            openPrice,
            false,
            true
        );

        actionInProgress = false;
        return "ok";
    } catch (error) {
        actionInProgress = false;
        console.error(error);
        return "error";
    }
}

/**
 * SELL FUNCTION
 *
 * @returns void
 */
async function sellPercentage(
    openPrice,
    percentage,
) {
    console.log("Selling...");

    let quantityToSell = +(lastBuyBTCTotal * 0.125);
    // if quantity to sell is > than what we have in btc BUT we still have some btc, take the full import
    console.log(quantityToSell);
    console.log(btcBalance);
    if (quantityToSell > btcBalance) {
        quantityToSell = btcBalance;
    }

    const truncatedQuantityToSell =
        Math.trunc(quantityToSell * 100000) / 100000;

    const order = {
        symbol: "BTCUSDT",
        side: "SELL",
        type: "LIMIT",
        timeInForce: "FOK",
        price: openPrice,
        quantity: truncatedQuantityToSell,
        timestamp: Date.now(),
    };
    console.log(order);
    const signature = crypto
        .createHmac("sha256", SECRET)
        .update(qs.stringify(order))
        .digest("hex");

    try {
        const response = await axios.post(
            `${baseUrl}/api/v3/order`,
            qs.stringify({
                ...order,
                signature,
            }),
            {
                headers: {
                    "X-MBX-APIKEY": APIKEY,
                },
            }
        );

        // TODO if it returns expired, try again
        if (response.data.status !== "FILLED") {
            console.log("Order not filled");
            if (response.data.status === "EXPIRED") {
                actionInProgress = false;
                return "expired";
            }
            actionInProgress = false;
            return;
        }

        // save in log file
        let tims = Date.now();
        fs.appendFile(
            "log.txt",
            `${new Date(
                tims
            ).toLocaleString()} - Sold ${quantityToSell} BTC at price ${openPrice}\n`,
            function (err) {
                if (err) throw err;
                console.log("Saved!");
            }
        );

        console.log("Order placed successfully at price " + openPrice);

        // set the last action time to the current time
        lastActionTime = new Date().getTime();

        // update averageSellPrice
        averageSellPrice = await updateAverageSellPrice(openPrice);

        await SellMovements.create({
            price: openPrice,
            quantity: quantityToSell,
            timestamp: Date.now(),
            symbol: "BTCUSDT",
        });

        await refreshParameters();

        await sendEmail(
            "Has sold",
            btcBalance,
            usdtBalance,
            Date.now(),
            percentage,
            quantityToSell.toFixed(5),
            openPrice,
            false,
            true
        );

        actionInProgress = false;
        return "ok";
    } catch (error) {
        actionInProgress = false;
        console.error(error);
    }
}

/**
 * CALCULATE AVG SELL PRICE FUNCTION
 *
 * @param lastSellprice
 * @returns averageSellPrice
 */
async function updateAverageSellPrice(lastSellprice) {
    // get all the sell prices from db
    const sellMovements = await SellMovements.findAll({});
    if (sellMovements.length === 0) {
        return lastSellprice;
    }
    const sellPrices = sellMovements.map((movement) => movement.price);
    let totalSellPrice = sellPrices.reduce((acc, price) => acc + price, 0);
    totalSellPrice += lastSellprice;
    const avg = totalSellPrice / sellPrices.length + 1;
    // return the result
    return avg;
}

export { main, refreshParameters, buyOneEth };
