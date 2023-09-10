// function to send email with some data
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_SENDER = process.env.EMAIL_SENDER;
const EMAIL_RECEIVER1 = process.env.EMAIL_RECEIVER1 || null;
const EMAIL_RECEIVER2 = process.env.EMAIL_RECEIVER2 || null;
const EMAIL_RECEIVER3 = process.env.EMAIL_RECEIVER3 || null;

async function sendEmail(
    actionString,
    btcBalance,
    usdtBalance,
    timestamp,
    percentage,
    quantity,
    price,
    routineCheck,
    isStarted
) {
    timestamp = new Date(timestamp).toLocaleString();

    try {
        const text = `
    BTC Balance: ${btcBalance}
    USDT Balance: ${usdtBalance}
    Action: ${actionString}
    Quantity: ${quantity}
    Price: ${price}
    Percentage: ${percentage}
    Timestamp ${timestamp}
    `;

        // send message to more than one receiver

        let message = {
            from: EMAIL_SENDER,
            to: [EMAIL_RECEIVER1, EMAIL_RECEIVER2, EMAIL_RECEIVER3],
            subject: `Binance SmartHolder - ${actionString}`,
            text: text,
            html: `<h3> Binance SmartHolder 💰</h3>
            <p> AT: ${timestamp} </p>
            <p> The Bot ${actionString} ${quantity} BTC at ${price}, to a percetage of ${percentage}</p>
            <h4> Balances Now: </h4>
            <p> BTC: ${btcBalance} </p>
            <p> USDT: ${usdtBalance} </p>
            `,
        };

        if (routineCheck) {
            message = {
                from: EMAIL_SENDER,
                to: [EMAIL_RECEIVER1, EMAIL_RECEIVER2, EMAIL_RECEIVER3],
                subject: `Binance SmartHolder - Routine Check`,
                text: "Routine Check",
                html: `<h3> Binance SmartHolder 💰</h3>
                <p> AT: ${timestamp} </p>
                <p> The Bot is running :D </p>
                <h4> Balances Now: </h4>
                <p> BTC: ${btcBalance} </p>
                <p> USDT: ${usdtBalance} </p>
                `,
            };
        }

        const transporter = nodemailer.createTransport({
            // PUT THE HOST OF YOUR SENDER EMAIL HERE (i.e. if something@gmail.com, put gmail.com)
            host: "",
            port: 465,
            secure: true,
            auth: {
                user: EMAIL_SENDER,
                pass: EMAIL_PASSWORD,
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        });

        transporter.verify(function (error, success) {
            if (error) {
                console.log(error);
            } else {
                console.log("Sending Email...");
            }
        });

        let stoppedMessage = {
            from: EMAIL_SENDER,
            to: [EMAIL_RECEIVER1, EMAIL_RECEIVER2, EMAIL_RECEIVER3],
            subject: `Binance SmartHolder - STOPPED`,
            text: "Routine Check",
            html: `<h3> Binance SmartHolder 💰</h3>
        <p> AT: ${timestamp} </p>
        <p> The Bot is stopped :( </p>
        <h4> Balances Now: </h4>
        <p> BTC: ${btcBalance} </p>
        <p> USDT: ${usdtBalance} </p>
        `,
        };

        if (!isStarted) {
            transporter.sendMail(stoppedMessage);
            return;
        }

        // send mail with defined transport object
        transporter.sendMail(message);
    } catch (error) {
        console.log(error);
    }
}

async function sendErrorEmail(error) {
    try {
        const text = `
    Error: ${error}
    `;
        const message = {
            from: EMAIL_SENDER,
            to: [EMAIL_RECEIVER1],
            subject: `Binance SmartHolder - ERROR`,
            text: text,
            html: `<h3> Binance SmartHolder 💰</h3>
        <p> Error: ${error} </p>
        `,
        };

        const transporter = nodemailer.createTransport({
            // PUT THE HOST OF YOUR SENDER EMAIL HERE (i.e. if something@gmail.com, put gmail.com)
            host: "",
            port: 465,
            secure: true,
            auth: {
                user: EMAIL_SENDER,
                pass: EMAIL_PASSWORD,
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        });

        transporter.verify(function (error, success) {
            if (error) {
                console.log(error);
            } else {
                console.log("Server is ready to take our messages");
            }
        });

        // send mail with defined transport object
        let info = await transporter.sendMail(message);
    } catch (error) {
        console.log(error);
    }
}

export { sendEmail, sendErrorEmail };
