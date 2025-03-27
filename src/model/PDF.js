import mongoose from "mongoose";

const PDFSchema = new mongoose.Schema({
  subjectCode: { type: String, required: true },
  name: { type: String, required: true },
  driveId: { type: String, required: true },
  type : {type: String, required: true}
});

const PDF = mongoose.model("pdfs", PDFSchema);
export default PDF;
