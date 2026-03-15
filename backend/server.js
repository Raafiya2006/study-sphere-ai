const express = require("express");
const multer = require("multer");
const cors = require("cors");
const pdf = require("pdf-parse"); // Ensure you ran 'npm install pdf-parse'
const { GoogleGenerativeAI } = require("@google-cloud/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 1. Route: Upload PDF and Extract Text
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const fs = require("fs");
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdf(dataBuffer);
    
    res.json({ 
      message: "File uploaded and processed successfully!", 
      text: data.text 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to extract text from PDF." });
  }
});

// 2. Route: Smart Analysis (Flashcards, Quiz, Summary, Key Points)
app.post("/analyze-doc", async (req, res) => {
  const { context } = req.body;

  if (!context) return res.status(400).json({ error: "No document context provided." });

  const prompt = `
    Analyze the following study material and return a JSON object. 
    Strictly follow this JSON format without any extra text or markdown code blocks:
    {
      "summary": "A 3-sentence high-level summary",
      "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
      "flashcards": [
        {"front": "Question/Term 1", "back": "Answer/Definition 1"},
        {"front": "Question/Term 2", "back": "Answer/Definition 2"},
        {"front": "Question/Term 3", "back": "Answer/Definition 3"}
      ],
      "quiz": [
        {"question": "Q1", "options": ["A", "B", "C", "D"], "answer": "Correct Option"},
        {"question": "Q2", "options": ["A", "B", "C", "D"], "answer": "Correct Option"}
      ]
    }

    Document Content: ${context.substring(0, 15000)} 
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Clean potential markdown from AI response
    const cleanJson = responseText.replace(/```json|```/gi, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI Analysis failed." });
  }
});

// 3. Route: Regular Chat Q&A
app.post("/ask-ai", async (req, res) => {
  const { question, context } = req.body;
  try {
    const prompt = `Context: ${context}\n\nQuestion: ${question}`;
    const result = await model.generateContent(prompt);
    res.json({ answer: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: "AI Chat failed." });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));