import express from 'express';
import { deletePDFFromDatabase, getPDFList, getQuestionsAndAnswersBySubjectCode, saveNewPDFIntoDatabase } from '../controller/query.js';
import { createNote, createQuestionPaper } from '../controller/pdf.js';
import { uploadToGoogleDrive, listPDFs, deleteFromGoogleDrive } from '../controller/drive.js';
import multer from 'multer';

const router = express.Router();

const multerUpload = multer()

router.post("/qaNotes",  async (req, res) => {
    try {
        const body = req.body;
        /*
            {
                subjectCode: string;
                subjectName: string;
            }
        */
        const pdfName = `Question Answer Notes of ${body.subjectName}`
        const queryResult = await getQuestionsAndAnswersBySubjectCode(body.subjectCode);

        const data = {
            subjectCode: body.subjectCode,
            subjectName: body.subjectName,
            list: queryResult,
            pdfName: pdfName
        };
        
        const pdfBuffer = await createNote(data);
        const driveId = await uploadToGoogleDrive(data.pdfName, pdfBuffer);
        await saveNewPDFIntoDatabase({
            subjectCode: data.subjectCode,
            name: data.pdfName,
            type: "qaNotes",
            driveId: driveId
        })
        return res.status(200).json({ driveId, name: data.pdfName, subjectCode: data.subjectCode, type: "qaNotes" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "not done" });
    }
});

router.post("/question-paper", async (req, res) => {
    try {
        /*
            body = {
                subjectName: string;
                subjectCode: string;
                longQuestions: string[];
                shortQuestions: string[];
                chooseFromLong: number;
                chooseFromShort: number;
                passMarks: number;
                marksOf1LongQuestion: number;
                marksOf1ShortQuestion: number;
                paperTitle: string;
            }
        */
        const body = req.body;
        const data = {
            ...body,
            pdfName: `${body.subjectName} - ${body.paperTitle}`
        }
        const pdfBuffer = await createQuestionPaper(data);
        const driveId = await uploadToGoogleDrive(data.pdfName, pdfBuffer);
        await saveNewPDFIntoDatabase({
            subjectCode: data.subjectCode,
            name: data.pdfName,
            type: "questionPaper",
            driveId: driveId
        })
        return res.status(200).json({ driveId, name: data.pdfName, subjectCode: data.subjectCode });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "not done" });
    }
});

router.get("/list/driveAll", async (req, res) => {
    try {
        const list = await listPDFs();
        if (list) return res.status(200).json({ list });
        return res.status(400).send("FILE cannot be found");
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get("/list", async (req,res) => {
    try {
        const { pdfType } = req.query; 
        const filter = pdfType ? { type: pdfType } : {}; 
        const list = await getPDFList(filter);
        if (list) return res.status(200).json({ list });
        return res.status(400).send("FILE cannot be found");
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

router.delete("/:id",  async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: "File ID is required." });
    }
    try {
        const response = await deleteFromGoogleDrive(id);
        await deletePDFFromDatabase(id)
        if (response.success) {
            return res.status(200).json(response);
        } else {
            return res.status(500).json(response);
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});


router.post("/questionPaper", multerUpload.single("file"), async (req,res)=>{
    try {
        const { name, subjectCode } = req.body;
        const fileBuffer = req.file.buffer; // File as buffer
        const driveId = await uploadToGoogleDrive(name, fileBuffer)
        await saveNewPDFIntoDatabase(
            {
                subjectCode: subjectCode,
                name: name,
                driveId: driveId,
                type: "questionPaper"
            }
        )
        return res.status(200).json(
            { driveId, name, subjectCode, type: "questionPaper"}
        )
    } catch (error) {
        console.log(error)
        return res.status(500).json({success: false, message: error.message})
    }
})


router.post("/questionPaperByDriveId", async (req,res)=>{
    try {
        const {name, subjectCode, driveId} = req.body
        await saveNewPDFIntoDatabase(
            {
                subjectCode,
                name,
                driveId,
                type: "questionPaper"
            }
        )
        return res.status(200).json(
            { driveId, name, subjectCode, type: "questionPaper"}
        )
    } catch (error) {
        console.log(error)
        return res.status(500).json({success: false, message: error.message})
    }
})

export default router;
