import DataTypes from "sequelize";
import sequelize from "./index.js";

const LastBtcBuyTable = sequelize.define("LastBtcBuyTable", {
    lastBuyBtcTot : {
        type: DataTypes.DECIMAL,
        allowNull: true,
    },
    timestamp: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    }
})

const BuyMovements = sequelize.define("BuyMovements", {
    price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
    symbol: {
        type: DataTypes.STRING,
        allowNull: false,
    }
});

const SellMovements = sequelize.define("SellMovements", {
    price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
    symbol: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

const Balances = sequelize.define("Balances", {
    btc: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
    usdt: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
});

const BotState = sequelize.define("BotState", {
    buy: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    sell: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
});

const AuthTable = sequelize.define("AuthTable", {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

async function synchronize() {
    await BotState.sync();
    await BuyMovements.sync();
    await SellMovements.sync();
    await Balances.sync();
    await AuthTable.sync();
    await LastBtcBuyTable.sync();
}
synchronize();

export { BuyMovements, SellMovements, Balances, BotState, AuthTable, LastBtcBuyTable };
