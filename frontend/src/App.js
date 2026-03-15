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
   YOUR INTERACTIVE WAVES LOGIC
====================== */
class Grad {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  dot2(x, y) { return this.x * x + this.y * y; }
}

class Noise {
  constructor(seed = 0) {
    this.grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];
    this.p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    this.perm = new Array(512); this.gradP = new Array(512); this.seed(seed);
  }
  seed(seed) {
    if (seed > 0 && seed < 1) seed *= 65536;
    seed = Math.floor(seed);
    for (let i = 0; i < 256; i++) {
      let v = i & 1 ? this.p[i] ^ (seed & 255) : this.p[i] ^ ((seed >> 8) & 255);
      this.perm[i] = this.perm[i + 256] = v;
      this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
    }
  }
  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(a, b, t) { return (1 - t) * a + t * b; }
  perlin2(x, y) {
    let X = Math.floor(x), Y = Math.floor(y); x -= X; y -= Y; X &= 255; Y &= 255;
    const n00 = this.gradP[X + this.perm[Y]].dot2(x, y), n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
    const n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y), n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);
    const u = this.fade(x); return this.lerp(this.lerp(n00, n10, u), this.lerp(n01, n11, u), this.fade(y));
  }
}

const InteractiveWaves = ({ lineColor = 'rgba(255, 255, 255, 0.4)' }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const noiseRef = useRef(new Noise(Math.random()));
  const linesRef = useRef([]);
  const mouseRef = useRef({ x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, vs: 0, a: 0, set: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const config = { waveSpeedX: 0.0125, waveSpeedY: 0.01, waveAmpX: 40, waveAmpY: 20, friction: 0.9, tension: 0.01, maxCursorMove: 120, xGap: 12, yGap: 36 };

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const setLines = () => {
      linesRef.current = [];
      const totalLines = Math.ceil(canvas.width / config.xGap) + 5;
      const totalPoints = Math.ceil(canvas.height / config.yGap) + 5;
      for (let i = 0; i <= totalLines; i++) {
        const pts = [];
        for (let j = 0; j <= totalPoints; j++) {
          pts.push({ x: i * config.xGap, y: j * config.yGap, wave: { x: 0, y: 0 }, cursor: { x: 0, y: 0, vx: 0, vy: 0 } });
        }
        linesRef.current.push(pts);
      }
    };

    const tick = (t) => {
      const mouse = mouseRef.current;
      mouse.sx += (mouse.x - mouse.sx) * 0.1;
      mouse.sy += (mouse.y - mouse.sy) * 0.1;
      const dx_m = mouse.x - mouse.lx, dy_m = mouse.y - mouse.ly;
      mouse.vs += (Math.hypot(dx_m, dy_m) - mouse.vs) * 0.1;
      mouse.vs = Math.min(100, mouse.vs);
      mouse.lx = mouse.x; mouse.ly = mouse.y;
      mouse.a = Math.atan2(dy_m, dx_m);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = lineColor;

      linesRef.current.forEach(pts => {
        pts.forEach((p, idx) => {
          const move = noiseRef.current.perlin2((p.x + t * config.waveSpeedX) * 0.002, (p.y + t * config.waveSpeedY) * 0.0015) * 12;
          p.wave.x = Math.cos(move) * config.waveAmpX;
          p.wave.y = Math.sin(move) * config.waveAmpY;

          const dx = p.x - mouse.sx, dy = p.y - mouse.sy;
          const dist = Math.hypot(dx, dy);
          const limit = Math.max(175, mouse.vs);
          if (dist < limit) {
            const f = Math.cos(dist * 0.001) * (1 - dist / limit);
            p.cursor.vx += Math.cos(mouse.a) * f * limit * mouse.vs * 0.00065;
            p.cursor.vy += Math.sin(mouse.a) * f * limit * mouse.vs * 0.00065;
          }

          p.cursor.vx += (0 - p.cursor.x) * config.tension;
          p.cursor.vy += (0 - p.cursor.y) * config.tension;
          p.cursor.vx *= config.friction; p.cursor.vy *= config.friction;
          p.cursor.x += p.cursor.vx * 2; p.cursor.y += p.cursor.vy * 2;

          const posX = p.x + p.wave.x + p.cursor.x;
          const posY = p.y + p.wave.y + p.cursor.y;

          if (idx === 0) ctx.moveTo(posX, posY);
          else ctx.lineTo(posX, posY);
        });
      });
      ctx.stroke();
      requestAnimationFrame(tick);
    };

    setSize(); setLines();
    window.addEventListener('resize', () => { setSize(); setLines(); });
    window.addEventListener('mousemove', (e) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY; });
    requestAnimationFrame(tick);
  }, [lineColor]);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -1, pointerEvents: 'none', background: '#070b14' }} />;
};

/* ======================
   MIND MAP & CARDS (SAME AS BEFORE)
====================== */
const MindMapNode = ({ data }) => (
  <div style={{ padding: '14px 28px', borderRadius: '50px', background: data.isRoot ? '#3b82f6' : '#1e293b', color: '#fff', border: data.isRoot ? '3px solid #60a5fa' : '1px solid #334155', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)', fontSize: '14px', fontWeight: '600', textAlign: 'center', minWidth: '200px' }}>
    <Handle type="target" position={Position.Left} style={{ background: '#3b82f6' }} />
    {data.label}
    <Handle type="source" position={Position.Right} style={{ background: '#3b82f6' }} />
  </div>
);

const nodeTypes = { mindMapNode: MindMapNode };

function MindMapContent({ data }) {
  const { fitView } = useReactFlow();
  const { nodes, edges } = useMemo(() => {
    const nodes = []; const edges = []; let lastDepthNodes = {};
    const lines = data.split('\n').filter(line => line.trim() !== "");
    lines.forEach((line, index) => {
      const isRoot = line.includes("Main Topic:"); const depth = line.search(/\S/) / 2;
      const label = line.trim().replace('Main Topic:', '').replace('├', '').replace('└', '');
      const nodeId = `node-${index}`;
      nodes.push({ id: nodeId, type: 'mindMapNode', data: { label, isRoot }, position: { x: depth * 450, y: (index * 130) - (depth * 60) } });
      if (depth > 0) {
        const parentId = lastDepthNodes[depth - 1];
        if (parentId) edges.push({ id: `e-${parentId}-${nodeId}`, source: parentId, target: nodeId, type: 'smoothstep', animated: true, style: { stroke: '#3b82f6', strokeWidth: 3 } });
      }
      lastDepthNodes[depth] = nodeId;
    });
    return { nodes, edges };
  }, [data]);

  useEffect(() => { setTimeout(() => fitView({ padding: 0.3, duration: 1000 }), 200); }, [data, fitView]);
  return (<ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} colorMode="dark"><Background color="transparent" gap={40} /><Controls /></ReactFlow>);
}

function MindMapVisualizer({ data }) {
  return (
    <div style={{ width: '100%', height: '700px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '24px', border: '2px solid #334155', overflow: 'hidden' }}>
      <ReactFlowProvider><MindMapContent data={data} /></ReactFlowProvider>
    </div>
  );
}

function StudyCard({ front, back }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const ref = useRef(null);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);

  function handleMouse(e) {
    if (!ref.current || isFlipped) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    rotateX.set((offsetY / (rect.height / 2)) * -14);
    rotateY.set((offsetX / (rect.width / 2)) * 14);
  }

  return (
    <div style={{ perspective: "1000px", cursor: "pointer", width: "100%", height: "220px" }} onMouseMove={handleMouse} onMouseEnter={() => scale.set(1.05)} onMouseLeave={() => { scale.set(1); rotateX.set(0); rotateY.set(0); }} onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div ref={ref} style={{ width: "100%", height: "100%", rotateX, rotateY, scale, transformStyle: "preserve-3d", position: "relative" }} animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
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
  const [file, setFile] = useState(null);
  const [pdfText, setPdfText] = useState("");
  const [result, setResult] = useState("");
  const [currentType, setCurrentType] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadFile = async () => {
    if (!file) return alert("Select file!");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://localhost:5000/upload", { method: "POST", body: formData });
      const data = await res.json();
      setPdfText(data.text);
      setLoading(false);
      alert("Uploaded!");
    } catch (e) { setLoading(false); alert("Error!"); }
  };

  const runAI = async (type) => {
    if (!pdfText) return alert("Upload PDF!");
    setLoading(true); setCurrentType(type);
    const res = await fetch("http://localhost:5000/ask-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, context: pdfText }) });
    const data = await res.json();
    setResult(data.answer); setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", padding: "40px", backgroundColor: "transparent", minHeight: "100vh", color: '#fff' }}>
      {/* YOUR INTERACTIVE WAVES COMPONENT */}
      <InteractiveWaves lineColor="rgba(59, 130, 246, 0.4)" />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ background: 'linear-gradient(to right, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '3.5rem', fontWeight: '900', marginBottom: '40px' }}>StudySphere AI</h1>
        
        <div style={{ background: "rgba(30, 41, 59, 0.4)", padding: "25px", borderRadius: "20px", display: "inline-block", border: '1px solid rgba(255,255,255,0.1)', marginBottom: '40px', backdropFilter: 'blur(10px)' }}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadFile} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: 'bold' }}>{loading ? "..." : "Upload"}</button>
        </div>
        
        <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "40px" }}>
          {["summary", "quiz", "flashcards", "mindmap"].map(btn => (
            <button key={btn} onClick={() => runAI(btn)} style={{ padding: '14px 28px', borderRadius: '12px', background: currentType === btn ? '#3b82f6' : 'rgba(30, 41, 59, 0.8)', color: '#fff', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)' }}>{btn}</button>
          ))}
        </div>

        <div style={{ maxWidth: "1200px", margin: "auto" }}>
          {currentType === "flashcards" && result && result.includes("|") ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "30px" }}>
              {result.split("\n").filter(l => l.includes("|")).map((l, i) => {
                const [f, b] = l.split("|");
                return <StudyCard key={i} front={f.replace("Front:", "").trim()} back={b.replace("Back:", "").trim()} />;
              })}
            </div>
          ) : currentType === "mindmap" && result ? (
            <MindMapVisualizer data={result} />
          ) : (
            <div style={{ background: "rgba(30, 41, 59, 0.3)", padding: "40px", borderRadius: "24px", border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', textAlign: 'left' }}>
              {loading ? "Generating..." : (result || "Welcome to StudySphere.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;