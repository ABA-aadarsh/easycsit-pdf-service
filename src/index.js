require("dotenv").config()
const cors = require("cors")
const express = require("express")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const { createPDFBuffer } = require("./controller/pdf")
const { uploadToGoogleDrive, listPDFs } = require("./controller/drive")
const app = express()
const portNumber = 8000

app.use(cookieParser())
app.use(
    cors(
        {
            origin: process.env.CORS_FRONTEND,
            methods: ["GET", "POST"],
            allowedHeaders: ["Content-Type", "Authorization"]
        }
    )
)

const authenticationMiddleware = async (req,res,next) => {
    try {
        const authToken = req.cookies["auth-token"]
        if(!authToken) return res.status(403).json({message: "No auth token"});
        const {payload} = jwt.verify(authToken, process.env.JWT_SECRET)
        console.log(payload)
        return next()
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "Server Failed"})
    }
}

app.use(express.json())
// app.use(authenticationMiddleware)
app.post("/pdf", async (req,res)=>{
    try {
        const body = req.body
        if(!body.md || !body.fileName) return res.status(406).json({message: "Invalid Format"});
        const buffer = await createPDFBuffer(body.md)
        const containsExt = body.fileName.includes(".pdf")
        const uploadURL = await uploadToGoogleDrive(body.fileName + (!containsExt ? ".pdf" : ""), buffer)
        return res.status(200).json(
            {
                message: "Successful Upload",
                uploadURL : uploadURL
            }
        )
    } catch (error) {
        console.log(error)
        return res.status(500).send()   
    }
})
app.get("/pdf/list", async (req,res)=>{
    try {
        const list = await listPDFs()
        if(list) return res.status(200).json({list: list});
        return res.status(400).send("FILE cannot be found")
    } catch (error) {
        console.log(error)
        return res.status(500).send()
    }
})



app.listen(portNumber, ()=>{
    console.log("listening on port : ", portNumber)
})