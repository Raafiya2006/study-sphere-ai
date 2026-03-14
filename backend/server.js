const express = require("express");
const cors = require("cors");
const multer = require("multer");
const PDFParser = require("pdf2json");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDAM3J9rCPOSZS8n_VN_rzKr0a9MT54iDk");

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("StudySphere AI backend is running");
});

// File storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Upload + Extract PDF Text
app.post("/upload", upload.single("file"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = "./uploads/" + req.file.filename;

    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", errData => {
      console.error(errData.parserError);
      res.json({
        message: "File uploaded successfully",
        text: "Could not extract text from this PDF."
      });
    });

    pdfParser.on("pdfParser_dataReady", pdfData => {

      let text = "";

      pdfData.Pages.forEach(page => {
        page.Texts.forEach(textItem => {
          text += decodeURIComponent(textItem.R[0].T) + " ";
        });
      });

      res.json({
        message: "File uploaded successfully",
        text: text
      });

    });

    pdfParser.loadPDF(filePath);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});


app.post("/ask-ai", async (req, res) => {
  try {

    const { question, context } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
    Use the following document to answer the question.

    Document:
    ${context}

    Question:
    ${question}
    `;

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    res.json({ answer: response });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI request failed" });
  }
});


// Start server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
