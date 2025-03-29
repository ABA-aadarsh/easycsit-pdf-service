import dotenv from "dotenv";
dotenv.config();

import Express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.js"
import pdfRouter from "./routes/pdf.js"
import {authenticationMiddleware} from "./controller/middlewares.js"
import { connectDB } from "./controller/database.js";

const app = Express()
const portNumber = 8000

app.use(cors({ origin: process.env.CORS_FRONTEND }));
app.use(Express.json());
connectDB();
app.use(Express.json())
app.use(cookieParser());
app.use('/auth', authRouter);
app.use('/pdf', authenticationMiddleware ,pdfRouter);

app.listen(portNumber, ()=>{
    console.log("listening on port : ", portNumber)
})