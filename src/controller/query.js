import PDF from "../model/PDF.js";
import QAModel from "../model/QA.js";

export const getQuestionsAndAnswersBySubjectCode= async (subjectCode) => {
  try {
    const questions = await QAModel.find({ subjectCode }, "question answer").limit(40);
    return questions;
  } catch (error) {
    console.error("Error fetching questions and answers:", error);
    throw error;
  }
}


export const saveNewPDFIntoDatabase = async (data) => {
  /*
    type of data
    {
      subjectCode: string,
      name: string;
      type: string ("questionPaper" | "qaNotes" | "aiNotes"),
      driveId: string
    }
  */
  try {
    const newPDF = new PDF({
      subjectCode: String(data.subjectCode).toLowerCase(),
      name: data.name,
      type: data.type,
      driveId: data.driveId
    });
    await newPDF.save();
    return { success: true, message: "PDF saved successfully" };
  } catch (error) {
    console.error("Error saving PDF:", error);
    return { success: false, message: "Failed to save PDF" };
  }
};


export const deletePDFFromDatabase = async (driveId) => {
  try {
    const result = await PDF.deleteOne({ driveId });
    if (result.deletedCount === 0) {
      return { success: false, message: "No PDF found with the given driveId" };
    }
    return { success: true, message: "PDF deleted successfully" };
  } catch (error) {
    console.error("Error deleting PDF:", error);
    return { success: false, message: "Failed to delete PDF" };
  }
};


export const getPDFList = async (filters) => {
  return await PDF.find(filters)
}