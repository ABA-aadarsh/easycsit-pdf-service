import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import jwt from 'jsonwebtoken';
const router = express.Router();

// Profile route
router.get("/profile", async (req, res) => {
    try {
        const authToken = req.cookies["authtoken"];
        if (!authToken) {
            return res.status(403).json({ message: "No auth token provided" });
        }
        const payload = jwt.verify(authToken, process.env.JWT_SECRET);
        return res.status(200).json({ username: payload.username });
    } catch (error) {
        console.log(error);
        return res.status(403).json({ message: "NOT AUTHENTICATED" });
    }
});

// Login route
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
            const newToken = jwt.sign(
                { username },
                process.env.JWT_SECRET
            );
            res.cookie('authtoken', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 3600000,
            });

            return res.status(200).json({ status: "Logged in" });
        }
        return res.status(403).json({ message: "Invalid password or username" });
    } catch (error) {
        console.log(error);
        return res.status(403).json({ message: "Pass username and password in body" });
    }
});

export default router;