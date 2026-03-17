require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const PDFParser = require("pdf2json");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("StudySphere AI backend is running");
});

if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ dest: "uploads/" });

const MODEL = "llama-3.3-70b-versatile";

async function askGroq(prompt) {
  const result = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2048,
  });
  return result.choices[0].message.content;
}

/* ── UPLOAD ── */
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = "./uploads/" + req.file.filename;
    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataReady", pdfData => {
      let text = "";
      pdfData.Pages.forEach(page => { page.Texts.forEach(t => { text += decodeURIComponent(t.R[0].T) + " "; }); });
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.json({ text });
    });
    pdfParser.on("pdfParser_dataError", err => { console.error(err); res.status(500).json({ error: "PDF Error" }); });
    pdfParser.loadPDF(filePath);
  } catch (error) { res.status(500).json({ error: "Upload failed" }); }
});

/* ── AI FEATURES ── */
app.post("/ask-ai", async (req, res) => {
  try {
    const { type, context } = req.body;
    if (!context) return res.status(400).json({ error: "No document text" });
    let prompt = "";
    if (type === "flashcards") {
      prompt = `Create 6 study flashcards from this document. 
Use exactly this format: Front: [Term] | Back: [Definition] 
Separate each card with a newline. No asterisks or markdown.
Document: ${context.substring(0, 15000)}`;
    } else if (type === "summary") {
      prompt = `Create a professional detailed study summary of this document.
Format: 1. Strong Title. 2. 3-4 sentence Overview. 3. Key Points with descriptions. 4. Conclusion.
No asterisks or markdown characters.
Document: ${context.substring(0, 15000)}`;
    } else if (type === "quiz") {
      prompt = `Generate 10 multiple choice questions based on this document.
Use this EXACT format for each:
Q: [Question]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
Correct: [Letter]
Reason: [One sentence explanation]

Document: ${context.substring(0, 15000)}`;
    } else if (type === "mindmap") {
      prompt = `Create a hierarchical mind map of this document.
Use this EXACT format:
Main Topic: [The Central Concept]
  ├ [Sub-topic 1]
    ├ [Detail A]
    └ [Detail B]
  ├ [Sub-topic 2]
  └ [Final Sub-topic]
Keep branches short (3-5 words max).
Document: ${context.substring(0, 15000)}`;
    }
    const answer = await askGroq(prompt);
    res.json({ answer });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI failed" });
  }
});

/* ── ELI5 EXPLAIN ── */
app.post("/explain", async (req, res) => {
  try {
    const { context, level } = req.body;
    if (!context) return res.status(400).json({ error: "No document text" });
    const levels = [
      "a 5 year old — use very simple words, fun comparisons, and short sentences. Make it playful.",
      "a 10 year old — use simple language, relatable examples, avoid heavy jargon.",
      "a high school student — clear language with some technical terms explained simply.",
      "a college student — proper academic terminology and reasonable depth.",
      "a PhD researcher — full technical language, academic depth, assume expert knowledge."
    ];
    const answer = await askGroq(
      `Explain the key concepts of this document to ${levels[level] || levels[2]}.
Be engaging, thorough, and well-structured. Use paragraphs.
Document: ${context.substring(0, 15000)}`
    );
    res.json({ answer });
  } catch (error) {
    console.error("Explain Error:", error);
    res.status(500).json({ error: "Explain failed" });
  }
});

/* ── CHAT ── */
app.post("/chat", async (req, res) => {
  try {
    const { message, context, history = [] } = req.body;
    if (!context) return res.status(400).json({ error: "Context missing" });
    const historyText = history.slice(-6).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`).join('\n');
    const prompt = `You are an AI Study Tutor helping a student understand a document.
Document:
---
${context.substring(0, 15000)}
---
${historyText ? `Previous conversation:\n${historyText}\n` : ''}
Answer clearly and concisely based ONLY on the document. If not in the document, say so politely.

Student: ${message}
Tutor:`;
    const answer = await askGroq(prompt);
    res.json({ answer });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`StudySphere running on port ${PORT}`));