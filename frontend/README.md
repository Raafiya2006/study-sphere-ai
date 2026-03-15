# StudySphere AI 🌐🧠
### *The Intelligent Knowledge Retrieval & "Second Brain" System*

**StudySphere AI** is a high-performance, AI-driven learning platform that transforms static documents into an interactive ecosystem. By utilizing advanced prompt engineering and real-time data visualization, it solves the problem of information overload, turning dense PDFs into "Second Brain" assets.

---

## 🚀 Problem Statement: AI-2
> *"Accessing and organizing knowledge from multiple sources can be overwhelming. There is a need for intelligent systems that help users retrieve, organize, and understand information quickly and efficiently."*

**Our Solution:** StudySphere AI provides an "Intelligent Retrieval" interface where users don't just read documents—they interact with them through AI Tutoring, 3D Flashcards, and Dynamic Mind Maps.

---

## ✨ Key Features
* **🤖 AI Study Tutor:** A real-time chat interface that allows users to "interview" their documents for specific facts.
* **📊 Dynamic Mind Mapping:** Automatically generates a hierarchical, visual structure of complex topics using **ReactFlow**.
* **📝 Professional Summarization:** Converts long-form content into structured study notes with an instant **PDF Export** feature.
* **🧠 Cognitive Quiz Engine:** Generates 10-question assessments with mistake tracking and logical reasoning feedback.
* **🃟 3D Glass-morphism Flashcards:** Utilizes **Framer Motion** for a tactile, interactive memory retention experience.
* **🌊 Interactive Math-driven UI:** A custom **Perlin Noise** background engine that reacts to user movements, creating a premium study environment.

---

## 🛠️ Tech Stack
* **Frontend:** React.js, Framer Motion (Animations), ReactFlow (Data Viz), jsPDF (Document Generation).
* **Backend:** Node.js, Express.
* **AI Engine:** Google Gemini 1.5 Flash (Generative AI & Prompt Engineering).
* **Parsing:** PDF2JSON (Server-side document extraction).

---

## 🏗️ System Architecture
```mermaid
graph TD
    subgraph Frontend [React Application]
        A[User Interface] --> B[File Upload Handler]
        A --> C[AI Study Hub]
        C --> C1[Summary/PDF Export]
        C --> C2[Interactive Quiz]
        C --> C3[Flashcards]
        C --> C4[Mind Map]
        A --> D[AI Tutor Sidebar]
    end

    subgraph Backend [Node.js & Express Server]
        E[Multer Middleware] --> F[PDF2JSON Parser]
        F --> G[Context Manager]
        G --> H{Gemini AI Engine}
    end

    subgraph External [External Services]
        H --> I[Google Gemini API]
        C1 --> J[jsPDF Library]
        C4 --> K[ReactFlow Engine]
    end

    B -->|Multipart Form Data| E
    C & D -->|JSON Prompt Engineering| H
    I -->|Generative Response| G
    G -->|Structured Data| A