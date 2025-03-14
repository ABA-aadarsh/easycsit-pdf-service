const markdownpdf = require("markdown-pdf");
const stream = require("stream")
const fs = require("fs");

const createPDF = async (markdown = "", fileName = "output.pdf") => {
    const markdownStream = new stream.Readable()
    markdownStream.push(markdown)
    markdownStream.push(null)

    await markdownStream
        .pipe(markdownpdf(
            {
                paperBorder: false,
                cssPath: "./src/controller/mdStyles/index.css",
                highlightCssPath: "./src/controller/mdStyles/highlight.css"
            }
        ))
        .pipe(fs.createWriteStream("/pdfs/" + fileName))

    console.log("PDF generated")
}

const createPDFBuffer = async (markdown = "") => {
    return new Promise((resolve, reject) => {
        markdownpdf()
        .from.string(markdown)
        .to.buffer((err, buffer) => {
            if (err) return reject(err);
            resolve(buffer)
        });
    });
}

module.exports = {
    createPDF,
    createPDFBuffer
}