require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const PDFParser = require("pdf2json");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads folder if it doesn't exist
if (!fs.existsSync("./uploads")) {
    fs.mkdirSync("./uploads");
}

// Initialize AI with your .env key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const upload = multer({ dest: "uploads/" });

/* ======================
   1. PDF UPLOAD & PARSE
====================== */
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = "./uploads/" + req.file.filename;
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataReady", pdfData => {
      let text = "";
      pdfData.Pages.forEach(page => {
        page.Texts.forEach(t => {
          text += decodeURIComponent(t.R[0].T) + " ";
        });
      });
      // Delete temp file after reading
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.json({ text });
    });

    pdfParser.on("pdfParser_dataError", err => {
      console.error(err);
      res.status(500).json({ error: "PDF Extraction Error" });
    });

    pdfParser.loadPDF(filePath);
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

/* ======================
   2. CORE AI FEATURES
====================== */
app.post("/ask-ai", async (req, res) => {
  try {
    const { type, context } = req.body;
    if (!context) return res.status(400).json({ error: "No document text found" });

    let prompt = "";
    if (type === "flashcards") {
      prompt = `Create 6 study flashcards from this document. 
      Use exactly this format: Front: [Term] | Back: [Definition] 
      Separate each card with a newline. Do not add markdown like asterisks.
      Document: ${context.substring(0, 15000)}`;
    } 
    else if (type === "summary") {
      prompt = `Create a professional, detailed study summary of this document. 
      Format it as follows:
      1. A strong Title.
      2. A 3-4 sentence Overview paragraph.
      3. Key Points section with detailed descriptions.
      4. A Conclusion paragraph.
      
      Do not use any asterisks (**) or special markdown characters.
      Document: ${context.substring(0, 15000)}`;
    } 
    else if (type === "quiz") {
      prompt = `Generate 10 multiple choice questions based on this document.
      Use this EXACT format for each:
      Q: [Question]
      A) [Option]
      B) [Option]
      C) [Option]
      D) [Option]
      Correct: [Letter]
      Reason: [One sentence explanation why]

      Document: ${context.substring(0, 15000)}`;
    } 
    else if (type === "mindmap") {
      prompt = `
      Create a hierarchical mind map of this document. 
      Use this EXACT format:
      Main Topic: [The Central Concept]
        ├ [Sub-topic 1]
          ├ [Detail A]
          └ [Detail B]
        ├ [Sub-topic 2]
        └ [Final Sub-topic]
      Focus on: Categories, Features, and Key Concepts.
      Keep branches short (3-5 words max).
      Document: ${context.substring(0, 15000)}`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    res.json({ answer: result.response.text() });
  } catch (error) {
    console.error("AI Route Error:", error);
    res.status(500).json({ error: "AI failed to generate content" });
  }
});

/* ======================
   3. INTELLIGENT RETRIEVAL (CHAT)
====================== */
app.post("/chat", async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!context) return res.status(400).json({ error: "Context missing" });

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      You are an AI Study Tutor. You are helping a student understand a document.
      Here is the document content for your reference:
      ---
      ${context.substring(0, 15000)}
      ---
      Answer the user's question clearly and concisely based ONLY on the text above. 
      If the information isn't in the document, politely say you don't know based on the provided material.
      
      User Question: ${message}
    `;

    const result = await model.generateContent(prompt);
    res.json({ answer: result.response.text() });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Chat processing failed" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 StudySphere Server running on port ${PORT}`));