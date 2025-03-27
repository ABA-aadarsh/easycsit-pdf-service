import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  explanation: { type: String, default: "" },
  videos: [{ type: String }], // Assuming video links are stored as strings
  marks: { type: Number, required: true },
  tags: [{ type: String }],
  subjectCode: { type: String, required: true },
  chapterName: { type: String, required: true },
});

const Question = mongoose.model("questionanswers", QuestionSchema);
export default Question;
