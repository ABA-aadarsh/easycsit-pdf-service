import fs from "fs";
import puppeteer from "puppeteer";
import path from "path";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { fileURLToPath } from "url";
import remarkPrism from "remark-prism";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const markdown_processor = unified()
.use(remarkParse)
.use(remarkGfm)
.use(remarkMath)
.use(remarkPrism)
.use(remarkRehype)
.use(rehypeKatex)
.use(rehypeStringify);

export const createNote = async (data)=>{
    /*
        data = {
            pdfName: string
            subjectCode: string;
            subjectName: string;
            list: {
                question: string;
                answer: string;
                videos: string[]
            }[]
        }
    */
    const questionProcessPromiseList = data.list.map(x=>markdown_processor.process(x.question))
    const answerProcessPromiseList = data.list.map(x=>markdown_processor.process(x.answer))
    const qList = (await Promise.all(questionProcessPromiseList)).map(x=>String(x))
    const aList = (await Promise.all(answerProcessPromiseList)).map(x=>String(x))
    const qaHTMLString = `<div class="qaAllContainer">`+qList.map((question, index)=>{
        const answer = aList[index]
        return (
            `
                <div class="notes_qa">
                    <div class="notes_qaIndex">Question no. ${index+1}</div>
                    <div class="notes_q">${question}</div>
                    <div class="notes_a">${answer}</div>
                </div>
            `
        )
    }).join("")+`</div>`

    const CSSFile = fs.readFileSync("./src/templates/index.css", "utf-8")
    const HTMLString = fs.readFileSync("./src/templates/notesTemplate.html", "utf-8")
    .replace("{{title}}", data.pdfName)
    .replace("{{css}}", `<style>${CSSFile}</style>`)
    .replace("{{subjectName}}", data.subjectName)
    .replace("{{subjectCode}}", String(data.subjectCode).toUpperCase())
    .replace("{{qaHTMLString}}", qaHTMLString)


    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const headerTemplate = fs.readFileSync("./src/templates/header.html", "utf-8");
    const footerTemplate = fs.readFileSync("./src/templates/footer.html", "utf-8");

    // Load the HTML directly without writing a temporary file
    await page.setContent(HTMLString, { waitUntil: "networkidle0" });

    await page.evaluate(async () => {
        const images = document.querySelectorAll("img");
        await Promise.all(Array.from(images).map(img => {
            return new Promise(resolve => {
                if (img.complete) resolve();
                else img.onload = resolve;
            });
        }));
    });

    // Generate PDF and store it as a buffer instead of saving
    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "20mm", bottom: "20mm", left: "10mm", right: "10mm" },
        displayHeaderFooter: true,
        headerTemplate: headerTemplate,
        footerTemplate: footerTemplate,
    });

    await browser.close();
    return pdfBuffer;
}

export const createQuestionPaper = async (data) => {
    /* 
        {
            subjectName: string;
            subjectCode: string;
            longQuestions: string[];
            shortQuestions: string[];
            chooseFromLong: number;
            chooseFromShort: number;
            passMarks: number;
            marksOf1LongQuestion: number;
            marksOf1ShortQuestion: number;
        }
    */
    const longQuestionProcessPromiseList = data.longQuestions.map(x => markdown_processor.process(x))
    const shortQuestionProcessPromiseList = data.shortQuestions.map(x => markdown_processor.process(x))

    data.longQuestions = (await Promise.all(longQuestionProcessPromiseList)).map(x => String(x))
    data.shortQuestions = (await Promise.all(shortQuestionProcessPromiseList)).map(x => String(x))

    const longQuestionsHTMLString = "<ol>"+data.longQuestions.map(
        (q)=>(
            `<li class="question">${q}</li>`
        )
    ).join("")+"</ol>"
    const shortQuestionsHTMLString = "<ol>"+data.shortQuestions.map(
        (q)=>(
            `<li class="question">${q}</li>`
        )
    ).join("")+"</ol>"

    const CSSFile = fs.readFileSync("./src/templates/index.css", "utf-8")
    const HTMLString = fs.readFileSync("./src/templates/template.html", "utf-8")
    .replace("{{title}}", data.pdfName)
    .replace("{{css}}", `<style>${CSSFile}</style>`)
    .replace("{{subjectName}}", data.subjectName)
    .replace("{{subjectCode}}", data.subjectCode)
    .replace("{{paperTitle}}", data.paperTitle)
    .replace("{{passMarks}}", data.passMarks)
    .replace("{{fullMarks}}", data.chooseFromLong * data.marksOf1LongQuestion + data.chooseFromShort * data.marksof1ShortQuestion)
    .replace("{{longQuestions.choose}}", data.chooseFromLong)
    .replace("{{longQuestionsMarksScheme}}", `${data.chooseFromLong} * ${data.marksOf1LongQuestion} = ${data.chooseFromLong * data.marksOf1LongQuestion}`)
    .replace("{{longQuestionsList}}", longQuestionsHTMLString)
    .replace("{{shortQuestions.choose}}", data.chooseFromShort)
    .replace("{{shortQuestionsMarksScheme}}", `${data.chooseFromShort} * ${data.marksof1ShortQuestion} = ${data.chooseFromShort * data.marksof1ShortQuestion}`)
    .replace("{{shortQuestionsList}}", shortQuestionsHTMLString)

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const headerTemplate = fs.readFileSync("./src/templates/header.html", "utf-8");
    const footerTemplate = fs.readFileSync("./src/templates/footer.html", "utf-8");

    // Load the HTML directly without writing a temporary file
    await page.setContent(HTMLString, { waitUntil: "networkidle0" });

    await page.evaluate(async () => {
        const images = document.querySelectorAll("img");
        await Promise.all(Array.from(images).map(img => {
            return new Promise(resolve => {
                if (img.complete) resolve();
                else img.onload = resolve;
            });
        }));
    });

    // Generate PDF and store it as a buffer instead of saving
    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "20mm", bottom: "20mm", left: "10mm", right: "10mm" },
        displayHeaderFooter: true,
        headerTemplate: headerTemplate,
        footerTemplate: footerTemplate,
    });

    await browser.close();
    return pdfBuffer;
};
