import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const SECRET_JWT = process.env.SECRET_JWT;

export const auth = async (req, res, next) => {
    try {
        const token = req.header("Authorization").replace("Bearer ", "");
        if (!token) {
            throw new Error();
        }
        const decoded = jwt.verify(token, SECRET_JWT);
        req.token = decoded;
        next();
    } catch (err) {
        res.status(401).send("false");
    }
};
