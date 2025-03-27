import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken"
export const authenticationMiddleware = async (req, res, next) => {
    try {
        const authToken = req.cookies["authtoken"];
        if (!authToken) {
            return res.status(403).json({ message: "No auth token provided" });
        }
        jwt.verify(authToken, process.env.JWT_SECRET);
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired, please log in again" });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }

        console.error(error);
        return res.status(500).json({ message: "Server error, please try again later" });
    }
};