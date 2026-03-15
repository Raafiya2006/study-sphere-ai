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

// 1. Upload Route
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
      // Delete file after reading text
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

// 2. AI Feature Route
app.post("/ask-ai", async (req, res) => {
  try {
    const { type, context } = req.body;
    if (!context) return res.status(400).json({ error: "No document text found" });

    let prompt = "";
    if (type === "flashcards") {
      prompt = `Create 6 study flashcards from this makeup document. 
      Use exactly this format: Front: [Term] | Back: [Definition] 
      Separate each card with a newline. Do not add any other text.
      Document: ${context.substring(0, 15000)}`;
    } 
    else if (type === "summary") {
      prompt = `Create a summary of this document. Include Title, Overview, and Key Points.\n\nDocument: ${context.substring(0, 15000)}`;
    } 
    else if (type === "quiz") {
      prompt = `Generate 5 multiple choice questions based on this document.\n\nDocument: ${context.substring(0, 15000)}`;
    } 
    // STEP 1: Updated Mindmap Prompt
    else if (type === "mindmap") {
      prompt = `
Create a hierarchical mind map of this makeup document. 

Use this EXACT format:
Main Topic: [The Central Concept]
  ├ [Sub-topic 1]
    ├ [Detail A]
    └ [Detail B]
  ├ [Sub-topic 2]
  └ [Final Sub-topic]

Focus on: Product Categories, Features, and Market Gaps.
Keep branches short (3-5 words max).

Document:
${context.substring(0, 15000)}
`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    res.json({ answer });
  } catch (error) {
    console.error("AI Route Error:", error);
    res.status(500).json({ error: "AI failed to generate content" });
  }
});

app.listen(5000, () => console.log("🚀 Server running on port 5000 with gemini-3-flash-preview"));