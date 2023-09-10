import { getAccountBalance } from "../trader/account.js";
import { seedDb, deleteAllData, helperSeedSellMovement, helperSeedBuyMovement } from "../helpers/seed.js";
import { AuthTable } from "../models/model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();
const { SECRET_JWT } = process.env;

const getBalance = async (req, res) => {
    try {
        const data = await getAccountBalance();
        if (data) {
            res.status(200);
            res.send(data);
        } else res.sendStatus(404);
    } catch (e) {
        console.log("e", e);
        res.sendStatus(500);
    }
};

const seedDatabase = async (req, res) => {
    try {
        const {
            buyFlag,
            sellFlag,
            btcBalance,
            usdtBalance,
            lastBuyPrice,
            lastSellPrice,
            lastBuyBtcTot,
        } = req.body;
        await seedDb(
            buyFlag,
            sellFlag,
            btcBalance,
            usdtBalance,
            lastBuyPrice,
            lastSellPrice,
            lastBuyBtcTot
        );
        res.status(201);
        res.send("database seeded successfully");
    } catch (e) {
        console.log("e", e);
        res.sendStatus(500);
    }
};

const seedSellMovement = async (req, res) => {
    try {
        const { openPrice, quantityToSell, timestampInMs } = req.body;
        if ( !openPrice || !quantityToSell || !timestampInMs ) return res.sendStatus(400)
        await helperSeedSellMovement(openPrice, quantityToSell, timestampInMs);
        res.status(201);
        res.send("db seeded");
    } catch(e) {
        console.log(e);
        res.sendStatus(500);
    }
}

const seedBuyMovement = async (req, res) => {
    try {
        const { openPrice, quantityToBuy, timestampInMs, seedLastBuyTable } = req.body;
        if ( !openPrice || !quantityToBuy || !timestampInMs ) return res.sendStatus(400)
        await helperSeedBuyMovement(openPrice, quantityToBuy, timestampInMs, seedLastBuyTable);
        res.status(201);
        res.send("db seeded");
    } catch(e) {
        console.log(e);
        res.sendStatus(500);
    }
}

const deleteDatabase = async (req, res) => {
    try {
        const { deleteAuthTable } = req.body;
        await deleteAllData(deleteAuthTable);
        res.status(201);
        res.send();
    } catch (e) {
        console.log("e", e);
        res.sendStatus(500);
    }
};

const startBot = async (req, res) => {
    try {
        isStarted = true;
        res.status(201);
        res.send("1");
    } catch (e) {
        console.log("e", e);
        res.sendStatus(500);
    }
};

const stopBot = async (req, res) => {
    try {
        isStarted = false;
        res.status(201);
        res.send("0");
    } catch (e) {
        console.log("e", e);
        res.sendStatus(500);
    }
};

const loginFunction = async (req, res) => {
    try {
        const { username, password } = req.body;

        // TODO : sanitize username and password

        const foundUser = await AuthTable.findOne({ where: { username } });
        if (!foundUser) {
            return res
                .status(401)
                .send({ error: "credentials are not correct" });
        }
        const isMatch = bcrypt.compareSync(password, foundUser.password);
        if (isMatch) {
            const token = jwt.sign(
                { id: foundUser.id.toString() },
                SECRET_JWT,
                {
                    expiresIn: "365d",
                }
            );
            return res
                .status(200)
                .send({ username: foundUser.username, token });
        } else {
            return res
                .status(401)
                .send({ error: "credentials are not correct" });
        }
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
};

const registerFunction = async (req, res) => {

    // TODO : sanitize username and password
    
    const { username, password } = req.body;
    const saltRounds = 10;
    const user = { username, password };
    if (user.password) {
        user.password = await bcrypt.hash(user.password, saltRounds);
    } else {
        return res.status(400).send({ error: "password is required" });
    }
    try {
        const createdUser = await AuthTable.create(user);
        if (createdUser) {
            return res.status(201).send("user created");
        }
    } catch (error) {
        throw error;
    }
};

const sendLogs = async (req, res) => {
    try {
        // get all the text from the log file
        const filePath = path.join("log.txt");
        // read content of the txt file
        const data = await fs.promises.readFile(filePath, "utf-8");
        // send the log file content as response
        res.send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving log file");
    }
};

export {
    getBalance,
    seedDatabase,
    deleteDatabase,
    startBot,
    stopBot,
    loginFunction,
    registerFunction,
    sendLogs,
    seedSellMovement,
    seedBuyMovement,
};
