import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setMessage(data.message);
    setPdfText(data.text);
  };

  const askAI = async () => {

    const res = await fetch("http://localhost:5000/ask-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: question,
        context: pdfText
      })
    });

    const data = await res.json();

    setAnswer(data.answer);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "80px", padding: "20px" }}>
      <h1>StudySphere AI</h1>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <br /><br />

      <button onClick={handleUpload}>Upload File</button>

      <p>{message}</p>

      <h3>Extracted Text</h3>

      <div style={{
        maxWidth: "800px",
        margin: "auto",
        textAlign: "left",
        background: "#f5f5f5",
        padding: "20px",
        borderRadius: "10px",
        maxHeight: "200px",
        overflow: "scroll"
      }}>
        {pdfText}
      </div>

      <br /><br />

      <h3>Ask Question About Document</h3>

      <input
        type="text"
        placeholder="Ask something about the document..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{ width: "400px", padding: "10px" }}
      />

      <br /><br />

      <button onClick={askAI}>Ask AI</button>

      <h3>AI Answer</h3>

      <div style={{
        maxWidth: "800px",
        margin: "auto",
        textAlign: "left",
        background: "#eef6ff",
        padding: "20px",
        borderRadius: "10px"
      }}>
        {answer}
      </div>

    </div>
  );
}

export default App;
