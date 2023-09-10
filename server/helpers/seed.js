import * as Model from "../models/model.js";
import { refreshParameters } from "../trader/trader.js";

async function helperSeedSellMovement(
    openPrice,
    quantityToSell,
    timestampInMs
) {
    try {
        const inserted = await Model.SellMovements.create({
            price: openPrice,
            quantity: quantityToSell,
            timestamp: timestampInMs,
            symbol: "BTCUSDT",
        });

        await refreshParameters();

        return inserted;
    } catch (e) {
        throw new Error(e);
    }
}

async function helperSeedBuyMovement(
    openPrice,
    quantityToBuy,
    timestampInMs,
    seedLastBuyTable
) {
    seedLastBuyTable = JSON.parse(seedLastBuyTable);

    if (!seedLastBuyTable) {
        try {
            const inserted = await Model.BuyMovements.create({
                price: openPrice,
                quantity: quantityToBuy,
                timestamp: timestampInMs,
                symbol: "BTCUSDT",
            });

            await refreshParameters();

            return inserted;
        } catch (e) {
            throw new Error(e);
        }
    }
    if (seedLastBuyTable) {
        try {
            const inserted = await Model.LastBtcBuyTable.create({
                lastBuyBtcTot: quantityToBuy,
                timestamp: timestampInMs
            })
            await refreshParameters();
            return inserted;
        } catch(e) {
            throw new Error(e);
        }
    }
}

// seed db with initial values
async function seedDb(
    buyFlag = false,
    sellFlag = false,
    btcBalance = 0,
    usdtBalance = 0,
    lastBuyPrice = 0,
    lastSellPrice = 0,
    lastBuyBtcTot = 0
) {
    await Model.BotState.upsert({
        buy: buyFlag,
        sell: sellFlag,
        id: 1,
    });

    await Model.LastBtcBuyTable.upsert({
        lastBuyBtcTot: lastBuyBtcTot,
        timestamp: Date.now(),
    });

    await Model.BuyMovements.create({
        price: lastBuyPrice,
        quantity: 0,
        timestamp: Date.now(),
        symbol: "BTCUSDT",
    });
    await Model.SellMovements.create({
        price: lastSellPrice,
        quantity: 0,
        timestamp: Date.now(),
        symbol: "BTCUSDT",
    });
    await Model.Balances.create({
        btc: btcBalance,
        usdt: usdtBalance,
        timestamp: 0,
    });

    // refresh the parameters
    await refreshParameters();
}

// create a function to delete all the data from the db and seed it with initial values
async function deleteAllData(deleteAuthTable = false) {
    if (deleteAuthTable) await Model.AuthTable.destroy({ where: {} });
    await Model.BotState.destroy({ where: {} });
    await Model.BuyMovements.destroy({ where: {} });
    await Model.SellMovements.destroy({ where: {} });
    await Model.Balances.destroy({ where: {} });
    await Model.LastBtcBuyTable.destroy({ where: {} });
}

export { seedDb, deleteAllData, helperSeedSellMovement, helperSeedBuyMovement };
