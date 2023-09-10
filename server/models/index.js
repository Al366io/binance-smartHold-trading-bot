// npm i pg sequelize
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
    "postgres",
    "postgres",
    "123456",
    {
        host: "db",
        dialect: "postgres",
        port: 5432,
        logging: false,
    }
);

const nodeEnv = process.env.NODE_ENV;

async function start() {
    try {
        await sequelize.authenticate();
        console.log("Connection to db ok");
    } catch (error) {
        console.log("err" + error);
    }
}

start();

export default sequelize;
