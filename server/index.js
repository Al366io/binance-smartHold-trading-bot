import express from "express";
import cors from "cors";
import router from "./router.js";
import http from "http";
import { main, refreshParameters } from "./trader/newTrader.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

global.io = new Server(server, {
    cors: {
        origin: "*",
    },
}); // in case server and client run on different urls

const port = 5000;

app.use(express.json());

// define allowed origins
const allowedOrigins = [
    "http://localhost:3000",
    // PUT HERE YOUR FRONTEND URL
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
                var msg =
                    "The CORS policy for this site does not " +
                    "allow access from the specified Origin.";
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
    })
);
app.use(router);

io.on("connection", (socket) => {
    console.log("a user connected");
});

server.listen(port, () => {
    console.log(`Server is running on port ${port} - http://localhost:${port}`);
});

// ------------------------------
async function start() {
    const nodeEnv = process.env.NODE_ENV;
    await refreshParameters(nodeEnv);
    main(nodeEnv);
}
setTimeout(start, 1000);

export { start };
