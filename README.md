
# 🌐 StudySphere AI — Your AI-Powered Second Brain

> Built by **Code Commanders** | AI-powered study assistant that transforms any document into smart study tools.

---

## 👥 Team Information

| Role | Name |
|------|------|
| Team Lead | Raafiya Taskeen |
| Team Member | Razinaa |

---

## 🚀 What We Built

StudySphere AI is an intelligent study companion that lets students upload any PDF document and instantly generate powerful study materials using AI. Instead of spending hours summarizing notes or making flashcards, StudySphere does it all in seconds.

---

## ✅ Features (Fully Working)

| Feature | Description |
|---------|-------------|
| 📄 PDF Upload | Upload any study material in PDF format |
| 📋 AI Summary | Generates a detailed, structured summary of the document |
| 🃏 Flashcards | Creates 6 interactive flip flashcards with key terms and definitions |
| 🧪 Quiz | Generates 10 multiple choice questions with answers and explanations |
| 🗺️ Mind Map | Visualizes document concepts as an interactive node-based mind map |
| 🧠 ELI5 Explain | Explains the document at 5 different reading levels (5yr old → PhD) |
| 💬 AI Tutor Chat | Chat with an AI tutor that answers questions based on your document |

---

## 🔶 Beta Features (In Progress)

| Feature | Status |
|---------|--------|
| 🔐 Authentication (Gmail + OAuth) | 🚧 Beta — Coming Soon |
| 👤 User Profiles & History | 🚧 Beta — Coming Soon |
| 📊 Progress Tracking | 🚧 Beta — Coming Soon |

---

## 🛠️ Tech Stack

**Frontend**
- React.js
- Framer Motion (animations)
- React Flow (mind map)
- jsPDF (PDF export)
- Deployed on **Vercel**

**Backend**
- Node.js + Express.js
- Groq AI API (LLaMA 3.3 70B)
- pdf2json (PDF parsing)
- Deployed on **Render**

---

## 🔗 Links

- 🌐 **Live Demo**: [https://study-sphere-lime.vercel.app](https://study-sphere-lime.vercel.app)
- 📁 **GitHub Repo**: [https://github.com/Raafiya2006/study-sphere-ai](https://github.com/Raafiya2006/study-sphere-ai)

---

## 📖 How to Use

1. Open the app at the deployment link above
2. Click **"Choose Study Material"** and upload a PDF
3. Click **"Lock In 🔒"** to process the document
4. Choose any feature — Summary, Quiz, Flashcards, Mind Map, or ELI5
5. Use the **💬 chat button** (bottom right) to ask questions about your document

---

## 🏃 How to Run Locally

**Backend**
```bash
cd backend
npm install
# Create a .env file with GROQ_API_KEY=your_key
npm start
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

---

## 📌 Notes

- Authentication is currently marked as **Beta** and will be implemented in the next version
- The app works best with text-based PDFs (not scanned images)

---

*Made with ❤️ by Code Commanders*
