import axios from "axios";
import crypto from "crypto";
import qs from "qs";
import dotenv from "dotenv";

dotenv.config();

const baseUrl = "https://api.binance.com";
// const baseUrl = 'https://testnet.binance.vision';
const { APIKEY, SECRET } = process.env;

const getAccountBalance = async () => {
    const timestamp = Date.now();
    const signature = crypto
        .createHmac("sha256", SECRET)
        .update(qs.stringify({ timestamp }))
        .digest("hex");

    const response = await axios.get(`${baseUrl}/api/v3/account`, {
        headers: {
            "X-MBX-APIKEY": APIKEY,
        },
        params: {
            timestamp,
            signature,
        },
    });
    let myBalance = {};
    if (response.status == 200) {
        response.data.balances
            .filter((balance) => balance.free > 0)
            .forEach((balance) => {
                myBalance[balance.asset] = balance.free;
            });
        // if btc is not in the balance, set it to 0
        if (!myBalance.BTC) {
            myBalance.BTC = 0;
        }
        // if usdt is not in the balance, set it to 0
        if (!myBalance.USDT) {
            myBalance.USDT = 0;
        }
        return { BTC: myBalance.BTC, USDT: myBalance.USDT };
    }
};

export { getAccountBalance };
