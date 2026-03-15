import React, { useState, useRef, useMemo, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Handle, 
  Position, 
  useReactFlow, 
  ReactFlowProvider 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const springValues = { damping: 30, stiffness: 100, mass: 2 };

/* ======================
   SMART QUIZ COMPONENT
====================== */
function QuizView({ data }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Parse AI response into objects with Reason support
  const questions = useMemo(() => {
    return data.split(/Q:/).filter(q => q.trim()).map(qBlock => {
      const lines = qBlock.split('\n').filter(l => l.trim());
      return {
        question: lines[0].replace(/\*\*/g, "").trim(),
        options: lines.slice(1, 5).map(opt => opt.replace(/\*\*/g, "").trim()),
        correct: lines.find(l => l.includes("Correct:"))?.split(":")[1]?.trim(),
        reason: lines.find(l => l.includes("Reason:"))?.split(":")[1]?.trim()
      };
    });
  }, [data]);

  const q = questions[currentQ];

  const checkAnswer = () => {
    if (selected === q.correct) setScore(score + 1);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setIsAnswered(false);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) return (
    <div style={{ padding: '60px', background: 'rgba(30, 41, 59, 0.7)', borderRadius: '24px', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Quiz Finished! 🏆</h2>
      <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '20px' }}>Great job mastering this document!</p>
      <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '30px' }}>{score} / {questions.length}</div>
      <button onClick={() => window.location.reload()} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>Restart Study Session</button>
    </div>
  );

  return (
    <div style={{ textAlign: 'left', maxWidth: '800px', margin: 'auto', background: 'rgba(30, 41, 59, 0.8)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(15px)' }}>
      <p style={{ color: '#94a3b8', marginBottom: '10px' }}>Question {currentQ + 1} of {questions.length}</p>
      <h3 style={{ marginBottom: '30px', fontSize: '1.5rem', fontWeight: '700' }}>{q.question}</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {q.options.map((opt, i) => {
          const letter = opt.trim().charAt(0);
          let bgColor = 'rgba(15, 23, 42, 0.6)';
          let borderColor = 'rgba(255,255,255,0.1)';

          if (isAnswered) {
            if (letter === q.correct) {
              bgColor = 'rgba(34, 197, 94, 0.2)';
              borderColor = '#22c55e';
            } else if (selected === letter && selected !== q.correct) {
              bgColor = 'rgba(239, 44, 44, 0.2)';
              borderColor = '#ef4444';
            }
          } else if (selected === letter) {
            bgColor = '#3b82f6';
            borderColor = '#60a5fa';
          }

          return (
            <button
              key={i}
              disabled={isAnswered}
              onClick={() => setSelected(letter)}
              style={{ textAlign: 'left', padding: '20px', borderRadius: '15px', background: bgColor, border: `2px solid ${borderColor}`, color: '#fff', cursor: isAnswered ? 'default' : 'pointer', transition: '0.2s', fontSize: '1.1rem' }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '25px', padding: '20px', borderRadius: '12px', background: selected === q.correct ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 44, 44, 0.1)', border: `1px solid ${selected === q.correct ? '#22c55e' : '#ef4444'}` }}>
          <strong style={{ color: selected === q.correct ? '#4ade80' : '#f87171', fontSize: '1.1rem' }}>
            {selected === q.correct ? "✅ Correct!" : `❌ Incorrect. The answer is ${q.correct}.`}
          </strong>
          <p style={{ marginTop: '10px', fontSize: '1rem', color: '#cbd5e1', lineHeight: '1.5' }}>{q.reason}</p>
        </motion.div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'right' }}>
        {!isAnswered ? (
          <button onClick={checkAnswer} disabled={!selected} style={{ background: '#3b82f6', color: '#fff', padding: '14px 45px', borderRadius: '50px', cursor: 'pointer', opacity: selected ? 1 : 0.5, fontWeight: 'bold' }}>Check Answer</button>
        ) : (
          <button onClick={handleNext} style={{ background: '#3b82f6', color: '#fff', padding: '14px 45px', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
            {currentQ === questions.length - 1 ? "View Results" : "Next Question"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ======================
   INTERACTIVE BACKGROUND
====================== */
class Grad { constructor(x,y,z) {this.x=x;this.y=y;this.z=z;} dot2(x,y) {return this.x*x+this.y*y;} }
class Noise {
  constructor(seed=0) {
    this.grad3=[new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];
    this.p=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    this.perm=new Array(512);this.gradP=new Array(512);this.seed(seed);
  }
  seed(seed) {
    if(seed>0 && seed<1) seed*=65536; seed=Math.floor(seed);
    for(let i=0;i<256;i++) { let v=i&1?this.p[i]^(seed&255):this.p[i]^((seed>>8)&255); this.perm[i]=this.perm[i+256]=v; this.gradP[i]=this.gradP[i+256]=this.grad3[v%12]; }
  }
  fade(t) { return t*t*t*(t*(t*6-15)+10); }
  lerp(a,b,t) { return (1-t)*a+t*b; }
  perlin2(x,y) {
    let X=Math.floor(x), Y=Math.floor(y); x-=X; y-=Y; X&=255; Y&=255;
    const n00=this.gradP[X+this.perm[Y]].dot2(x,y), n01=this.gradP[X+this.perm[Y+1]].dot2(x,y-1), n10=this.gradP[X+1+this.perm[Y]].dot2(x-1,y), n11=this.gradP[X+1+this.perm[Y+1]].dot2(x-1,y-1);
    const u=this.fade(x); return this.lerp(this.lerp(n00,n10,u),this.lerp(n01,n11,u),this.fade(y));
  }
}

const InteractiveWaves = ({ lineColor = 'rgba(59, 130, 246, 0.4)' }) => {
  const containerRef = useRef(null); const canvasRef = useRef(null);
  const noiseRef = useRef(new Noise(Math.random())); const linesRef = useRef([]);
  const mouseRef = useRef({ x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, vs: 0, a: 0, set: false });

  useEffect(() => {
    const canvas = canvasRef.current; const container = containerRef.current; const ctx = canvas.getContext('2d');
    const setSize = () => { const b = container.getBoundingClientRect(); canvas.width = b.width; canvas.height = b.height; };
    const setLines = () => {
      linesRef.current = []; const xGap = 12, yGap = 36;
      for (let i = 0; i <= Math.ceil(canvas.width / xGap) + 5; i++) {
        const pts = []; for (let j = 0; j <= Math.ceil(canvas.height / yGap) + 5; j++) { pts.push({ x: i * xGap, y: j * yGap, wave: { x: 0, y: 0 }, cursor: { x: 0, y: 0, vx: 0, vy: 0 } }); }
        linesRef.current.push(pts);
      }
    };
    const tick = (t) => {
      const mouse = mouseRef.current; mouse.sx += (mouse.x - mouse.sx) * 0.1; mouse.sy += (mouse.y - mouse.sy) * 0.1;
      const dx_m = mouse.x - mouse.lx, dy_m = mouse.y - mouse.ly; mouse.vs += (Math.hypot(dx_m, dy_m) - mouse.vs) * 0.1;
      mouse.lx = mouse.x; mouse.ly = mouse.y; mouse.a = Math.atan2(dy_m, dx_m);
      ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.beginPath(); ctx.strokeStyle = lineColor;
      linesRef.current.forEach(pts => {
        pts.forEach((p, idx) => {
          const move = noiseRef.current.perlin2((p.x + t * 0.0125) * 0.002, (p.y + t * 0.01) * 0.0015) * 12;
          p.wave.x = Math.cos(move) * 40; p.wave.y = Math.sin(move) * 20;
          const dx = p.x - mouse.sx, dy = p.y - mouse.sy; const dist = Math.hypot(dx, dy); const limit = Math.max(175, mouse.vs);
          if (dist < limit) { const f = Math.cos(dist * 0.001) * (1 - dist / limit); p.cursor.vx += Math.cos(mouse.a) * f * limit * mouse.vs * 0.00065; p.cursor.vy += Math.sin(mouse.a) * f * limit * mouse.vs * 0.00065; }
          p.cursor.vx += (0 - p.cursor.x) * 0.01; p.cursor.vy += (0 - p.cursor.y) * 0.01; p.cursor.vx *= 0.9; p.cursor.vy *= 0.9;
          p.cursor.x += p.cursor.vx * 2; p.cursor.y += p.cursor.vy * 2;
          if (idx === 0) ctx.moveTo(p.x + p.wave.x + p.cursor.x, p.y + p.wave.y + p.cursor.y);
          else ctx.lineTo(p.x + p.wave.x + p.cursor.x, p.y + p.wave.y + p.cursor.y);
        });
      }); ctx.stroke(); requestAnimationFrame(tick);
    };
    setSize(); setLines(); window.addEventListener('resize', setSize);
    window.addEventListener('mousemove', (e) => { const b = container.getBoundingClientRect(); mouseRef.current.x = e.clientX - b.left; mouseRef.current.y = e.clientY - b.top; });
    requestAnimationFrame(tick);
  }, [lineColor]);
  return <div ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: '#070b14', pointerEvents: 'none' }}><canvas ref={canvasRef} /></div>;
};

/* ======================
   MIND MAP & CARDS
====================== */
const MindMapNode = ({ data }) => (
  <div style={{ padding: '14px 28px', borderRadius: '50px', background: data.isRoot ? '#3b82f6' : '#1e293b', color: '#fff', border: data.isRoot ? '3px solid #60a5fa' : '1px solid #334155', fontSize: '14px', fontWeight: '600', textAlign: 'center', minWidth: '200px' }}>
    <Handle type="target" position={Position.Left} /> {data.label} <Handle type="source" position={Position.Right} />
  </div>
);
const nodeTypes = { mindMapNode: MindMapNode };

function MindMapVisualizer({ data }) {
  const { fitView } = useReactFlow();
  const { nodes, edges } = useMemo(() => {
    const nodes = []; const edges = []; let lastDepthNodes = {};
    data.split('\n').filter(l => l.trim()).forEach((line, index) => {
      const isRoot = line.includes("Main Topic:"), depth = line.search(/\S/) / 2, nodeId = `node-${index}`;
      nodes.push({ id: nodeId, type: 'mindMapNode', data: { label: line.trim().replace('Main Topic:', '').replace('├', '').replace('└', ''), isRoot }, position: { x: depth * 450, y: (index * 130) - (depth * 60) } });
      if (depth > 0 && lastDepthNodes[depth-1]) edges.push({ id: `e-${index}`, source: lastDepthNodes[depth-1], target: nodeId, type: 'smoothstep', animated: true, style: { stroke: '#3b82f6', strokeWidth: 3 } });
      lastDepthNodes[depth] = nodeId;
    });
    return { nodes, edges };
  }, [data]);
  useEffect(() => { setTimeout(() => fitView({ padding: 0.3, duration: 1000 }), 200); }, [data, fitView]);
  return <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} colorMode="dark"><Background color="transparent" /><Controls /></ReactFlow>;
}

function StudyCard({ front, back }) {
  const [isFlipped, setIsFlipped] = useState(false); const ref = useRef(null);
  const rotateX = useSpring(useMotionValue(0), springValues); const rotateY = useSpring(useMotionValue(0), springValues);
  return (
    <div style={{ perspective: "1000px", cursor: "pointer", width: "100%", height: "220px" }} onMouseMove={(e) => { if (!ref.current || isFlipped) return; const rect = ref.current.getBoundingClientRect(); rotateX.set(((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -14); rotateY.set(((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 14); }} onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div ref={ref} style={{ width: "100%", height: "100%", rotateX, rotateY, transformStyle: "preserve-3d", position: "relative" }} animate={{ rotateY: isFlipped ? 180 : 0 }}>
        <div style={{ position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden", background: "white", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", padding: "20px", textAlign: "center" }}><strong style={{ color: "#2563eb" }}>{front}</strong></div>
        <div style={{ position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden", background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "white", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotateY(180deg)", padding: "20px", textAlign: "center" }}><p>{back}</p></div>
      </motion.div>
    </div>
  );
}

/* ======================
   MAIN APP
====================== */
function App() {
  const [file, setFile] = useState(null); const [pdfText, setPdfText] = useState("");
  const [result, setResult] = useState(""); const [currentType, setCurrentType] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadFile = async () => {
    if (!file) return alert("Select file!"); setLoading(true);
    const formData = new FormData(); formData.append("file", file);
    try { const res = await fetch("http://localhost:5000/upload", { method: "POST", body: formData }); const data = await res.json(); setPdfText(data.text); alert("Uploaded!"); } catch (e) { alert("Error!"); } finally { setLoading(false); }
  };

  const runAI = async (type) => {
    if (!pdfText) return alert("Upload PDF!"); setLoading(true); setCurrentType(type);
    try { const res = await fetch("http://localhost:5000/ask-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, context: pdfText }) }); const data = await res.json(); setResult(data.answer); } catch (e) { setResult("AI Error."); } finally { setLoading(false); }
  };

  return (
    <div style={{ textAlign: "center", padding: "40px", backgroundColor: "transparent", minHeight: "100vh", color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <InteractiveWaves />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ background: 'linear-gradient(to right, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '3.5rem', fontWeight: '900', marginBottom: '40px' }}>StudySphere AI</h1>
        <div style={{ background: "rgba(30, 41, 59, 0.4)", padding: "25px", borderRadius: "20px", display: "inline-block", border: '1px solid rgba(255,255,255,0.1)', marginBottom: '40px', backdropFilter: 'blur(10px)' }}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadFile} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? "..." : "Upload"}</button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "40px" }}>
          {["summary", "quiz", "flashcards", "mindmap"].map(btn => (
            <button key={btn} onClick={() => runAI(btn)} style={{ padding: '14px 28px', borderRadius: '12px', background: currentType === btn ? '#3b82f6' : 'rgba(30, 41, 59, 0.8)', color: '#fff', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>{btn}</button>
          ))}
        </div>
        <div style={{ maxWidth: "1200px", margin: "auto" }}>
          {currentType === "quiz" && result ? <QuizView data={result} /> : currentType === "flashcards" && result && result.includes("|") ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "30px" }}>
              {result.split("\n").filter(l => l.includes("|")).map((l, i) => { const [f, b] = l.split("|"); return <StudyCard key={i} front={f.replace("Front:", "").trim()} back={b.replace("Back:", "").trim()} />; })}
            </div>
          ) : currentType === "mindmap" && result ? (
            <div style={{ height: '700px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '24px', border: '2px solid #334155', overflow: 'hidden' }}><ReactFlowProvider><MindMapVisualizer data={result} /></ReactFlowProvider></div>
          ) : (
            <div style={{ background: "rgba(30, 41, 59, 0.3)", padding: "40px", borderRadius: "24px", border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', textAlign: 'left' }}>{loading ? "Generating..." : (result || "Welcome to StudySphere.")}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;