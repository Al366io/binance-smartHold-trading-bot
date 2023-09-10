import express from "express";
import {
    getBalance,
    seedDatabase,
    deleteDatabase,
    startBot,
    stopBot,
    loginFunction,
    registerFunction,
    sendLogs,
    seedSellMovement,
    seedBuyMovement
} from "./controllers/controller.js";
import { auth } from "./middlewares/auth.js";

const router = express.Router();

router.get("/api/balance", auth, getBalance);

router.post("/api/seed", auth, seedDatabase);

router.post("/api/seed/sellMovement", seedSellMovement);

router.post("/api/seed/buyMovement", seedBuyMovement);

router.delete("/api/wipe", auth, deleteDatabase);

router.post("/api/start", auth, startBot);

router.post("/api/stop", auth, stopBot);

router.post("/api/validateToken", auth, (req, res) => {
    res.status(200);
    res.send("true");
});

router.post("/api/register", registerFunction);

router.post("/api/login", loginFunction);

router.get("/api/logs", auth, sendLogs);

export default router;
