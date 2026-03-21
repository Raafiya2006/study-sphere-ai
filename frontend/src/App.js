import React, { useState, useRef, useMemo, useEffect } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { ReactFlow, Background, Controls, Handle, Position, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import { jsPDF } from "jspdf";
import '@xyflow/react/dist/style.css';
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";

const API = "https://study-sphere-backend-r6u5.onrender.com";
const springValues = { damping: 30, stiffness: 100, mass: 2 };

class Grad { constructor(x,y,z){this.x=x;this.y=y;this.z=z;}dot2(x,y){return this.x*x+this.y*y;}}
class Noise {
  constructor(seed=0){this.grad3=[new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];this.p=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];this.perm=new Array(512);this.gradP=new Array(512);this.seed(seed);}
  seed(seed){if(seed>0&&seed<1)seed*=65536;seed=Math.floor(seed);for(let i=0;i<256;i++){let v=i&1?this.p[i]^(seed&255):this.p[i]^((seed>>8)&255);this.perm[i]=this.perm[i+256]=v;this.gradP[i]=this.gradP[i+256]=this.grad3[v%12];}}
  fade(t){return t*t*t*(t*(t*6-15)+10);}lerp(a,b,t){return(1-t)*a+t*b;}
  perlin2(x,y){let X=Math.floor(x),Y=Math.floor(y);x-=X;y-=Y;X&=255;Y&=255;const n00=this.gradP[X+this.perm[Y]].dot2(x,y),n01=this.gradP[X+this.perm[Y+1]].dot2(x,y-1),n10=this.gradP[X+1+this.perm[Y]].dot2(x-1,y),n11=this.gradP[X+1+this.perm[Y+1]].dot2(x-1,y-1);const u=this.fade(x);return this.lerp(this.lerp(n00,n10,u),this.lerp(n01,n11,u),this.fade(y));}
}

const RestoredWaves = ({ lineColor = 'rgba(59, 130, 246, 0.4)' }) => {
  const containerRef = useRef(null); const canvasRef = useRef(null);
  const noiseRef = useRef(new Noise(Math.random())); const linesRef = useRef([]);
  const mouseRef = useRef({ x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, vs: 0, a: 0 });
  const colorRef = useRef(lineColor);
  useEffect(() => { colorRef.current = lineColor; }, [lineColor]);
  useEffect(() => {
    const canvas = canvasRef.current; const container = containerRef.current; const ctx = canvas.getContext('2d');
    const setSize = () => { if(!container) return; const b = container.getBoundingClientRect(); canvas.width = b.width; canvas.height = b.height; };
    const setLines = () => {
      linesRef.current = []; const xGap = 12, yGap = 36;
      for (let i = 0; i <= Math.ceil(canvas.width/xGap)+5; i++) {
        const pts = []; for (let j = 0; j <= Math.ceil(canvas.height/yGap)+5; j++) pts.push({x:i*xGap,y:j*yGap,wave:{x:0,y:0},cursor:{x:0,y:0,vx:0,vy:0}});
        linesRef.current.push(pts);
      }
    };
    const tick = (t) => {
      const mouse = mouseRef.current; mouse.sx+=(mouse.x-mouse.sx)*0.1; mouse.sy+=(mouse.y-mouse.sy)*0.1;
      const dx=mouse.x-mouse.lx,dy=mouse.y-mouse.ly; mouse.vs+=(Math.hypot(dx,dy)-mouse.vs)*0.1; mouse.lx=mouse.x; mouse.ly=mouse.y; mouse.a=Math.atan2(dy,dx);
      ctx.clearRect(0,0,canvas.width,canvas.height); ctx.beginPath(); ctx.strokeStyle=colorRef.current;
      linesRef.current.forEach(pts => {
        pts.forEach((p,idx) => {
          const move=noiseRef.current.perlin2((p.x+t*0.0125)*0.002,(p.y+t*0.01)*0.0015)*12;
          p.wave.x=Math.cos(move)*40; p.wave.y=Math.sin(move)*20;
          const dx2=p.x-mouse.sx,dy2=p.y-mouse.sy,dist=Math.hypot(dx2,dy2),limit=Math.max(175,mouse.vs);
          if(dist<limit){const f=Math.cos(dist*0.001)*(1-dist/limit);p.cursor.vx+=Math.cos(mouse.a)*f*limit*mouse.vs*0.00065;p.cursor.vy+=Math.sin(mouse.a)*f*limit*mouse.vs*0.00065;}
          p.cursor.vx+=(0-p.cursor.x)*0.01;p.cursor.vy+=(0-p.cursor.y)*0.01;p.cursor.vx*=0.9;p.cursor.vy*=0.9;p.cursor.x+=p.cursor.vx*2;p.cursor.y+=p.cursor.vy*2;
          if(idx===0) ctx.moveTo(p.x+p.wave.x+p.cursor.x,p.y+p.wave.y+p.cursor.y);
          else ctx.lineTo(p.x+p.wave.x+p.cursor.x,p.y+p.wave.y+p.cursor.y);
        });
      }); ctx.stroke(); requestAnimationFrame(tick);
    };
    setSize(); setLines(); window.addEventListener('resize',setSize);
    const updateMouse=(e)=>{if(!container)return;const b=container.getBoundingClientRect();mouseRef.current.x=e.clientX-b.left;mouseRef.current.y=e.clientY-b.top;};
    window.addEventListener('mousemove',updateMouse); requestAnimationFrame(tick);
    return()=>{window.removeEventListener('resize',setSize);window.removeEventListener('mousemove',updateMouse);};
  }, []);
  return <div ref={containerRef} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',zIndex:-1,background:'#070b14',pointerEvents:'none'}}><canvas ref={canvasRef}/></div>;
};

/* ── ELI5 ── */
function ELI5View({ pdfText }) {
  const [level, setLevel] = useState(2);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const labels = ["🧒 5yr old","👦 10yr old","🎒 High School","🎓 College","🔬 PhD"];
  const colors = ["#f59e0b","#f97316","#3b82f6","#8b5cf6","#ec4899"];
  const explain = async () => {
    if (!pdfText) return alert("Upload a document first!");
    setLoading(true); setResult("");
    try {
      const res = await fetch(`${API}/explain`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({context:pdfText,level})});
      const d = await res.json(); setResult(d.answer);
    } catch(e){setResult("Error. Check server.");}
    finally{setLoading(false);}
  };
  return (
    <div style={{maxWidth:'900px',margin:'auto'}}>
      <div style={{background:"rgba(15,23,42,0.7)",padding:"40px",borderRadius:"24px",border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(10px)'}}>
        <h2 style={{color:'#60a5fa',marginBottom:'8px',fontSize:'1.8rem'}}>🧠 Explain Like I'm...</h2>
        <p style={{color:'#94a3b8',marginBottom:'30px'}}>Drag the slider — AI rewrites the entire document for that reading level</p>
        <div style={{textAlign:'center',marginBottom:'20px'}}>
          <motion.span key={level} initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}}
            style={{fontSize:'2.2rem',fontWeight:'900',color:colors[level],display:'inline-block'}}>{labels[level]}</motion.span>
        </div>
        <input type="range" min="0" max="4" value={level} onChange={e=>setLevel(Number(e.target.value))}
          style={{width:'100%',accentColor:colors[level],height:'6px',cursor:'pointer',marginBottom:'12px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'30px'}}>
          {labels.map((l,i)=>(
            <span key={i} onClick={()=>setLevel(i)} style={{fontSize:'0.68rem',color:i===level?colors[level]:'#475569',fontWeight:i===level?'bold':'normal',transition:'0.3s',cursor:'pointer'}}>{l}</span>
          ))}
        </div>
        <button onClick={explain} disabled={loading} style={{width:'100%',padding:'16px',borderRadius:'14px',background:loading?'#334155':`linear-gradient(135deg,${colors[level]},${colors[Math.min(level+1,4)]})`,color:'#fff',border:'none',fontWeight:'bold',fontSize:'1rem',cursor:loading?'not-allowed':'pointer',transition:'0.4s',marginBottom:'25px'}}>
          {loading?"✨ AI is rewriting for you...":`Explain at ${labels[level]} level →`}
        </button>
        {result && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            style={{color:'#cbd5e1',lineHeight:'1.9',borderTop:'1px solid #334155',paddingTop:'25px'}}>
            {result.split('\n').map((p,i)=>p.trim()&&<p key={i} style={{marginBottom:'15px'}}>{p}</p>)}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ── SUMMARY ── */
function SummaryView({ data }) {
  const cleanText = data.replace(/\*\*/g,"").trim();
  const downloadPDF = () => {
    const doc = new jsPDF(); const margin=15; const pageWidth=doc.internal.pageSize.getWidth()-(margin*2);
    doc.setFont("helvetica","bold");doc.setFontSize(22);doc.text("StudySphere Notes",margin,20);
    doc.setFont("helvetica","normal");doc.setFontSize(11);
    doc.text(doc.splitTextToSize(cleanText,pageWidth),margin,35);doc.save("Summary.pdf");
  };
  return (
    <div style={{textAlign:'left',maxWidth:'900px',margin:'auto'}}>
      <div style={{background:"rgba(15,23,42,0.6)",padding:"50px",borderRadius:"24px",border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(10px)',lineHeight:'1.8',color:'#cbd5e1'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'30px',alignItems:'center'}}>
          <h2 style={{color:'#60a5fa',margin:0,fontSize:'2rem'}}>📋 Knowledge Summary</h2>
          <button onClick={downloadPDF} style={{background:'#22c55e',color:'#fff',border:'none',padding:'12px 24px',borderRadius:'50px',fontWeight:'bold',cursor:'pointer'}}>📥 Download PDF</button>
        </div>
        {cleanText.split('\n').map((para,i)=>para.trim()&&<p key={i} style={{marginBottom:'20px'}}>{para.trim()}</p>)}
      </div>
    </div>
  );
}

/* ── QUIZ ── */
function QuizView({ data }) {
  const [currentQ,setCurrentQ]=useState(0);const [selected,setSelected]=useState(null);
  const [isAnswered,setIsAnswered]=useState(false);const [score,setScore]=useState(0);
  const [isComplete,setIsComplete]=useState(false);const [mistakes,setMistakes]=useState([]);
  const questions = useMemo(()=>data.split(/Q:/).filter(q=>q.trim() && q.includes('Correct:')).map(qBlock=>{
    const lines=qBlock.split('\n').filter(l=>l.trim());
    return{question:lines[0].replace(/\*\*/g,"").trim(),options:lines.slice(1,5).map(opt=>opt.replace(/\*\*/g,"").trim()),correct:lines.find(l=>l.includes("Correct:"))?.split(":")[1]?.trim(),reason:lines.find(l=>l.includes("Reason:"))?.split(":")[1]?.trim()};
  }),[data]);
  const q=questions[currentQ];
  const checkAnswer=()=>{if(selected===q.correct)setScore(s=>s+1);else setMistakes(prev=>[...prev,{...q,userChoice:selected}]);setIsAnswered(true);};
  if(isComplete) return (
    <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
      style={{padding:'50px',background:'rgba(15,23,42,0.8)',borderRadius:'24px',backdropFilter:'blur(15px)',color:'#fff',textAlign:'left'}}>
      <h2 style={{textAlign:'center',fontSize:'2.5rem',marginBottom:'10px'}}>{score>=questions.length*0.8?'🏆':score>=questions.length*0.5?'📚':'💪'} {score} / {questions.length}</h2>
      <p style={{textAlign:'center',color:'#94a3b8',marginBottom:'30px'}}>{score>=questions.length*0.8?'Excellent!':score>=questions.length*0.5?'Good effort!':'Keep studying!'}</p>
      {mistakes.length>0&&<div style={{maxHeight:'350px',overflowY:'auto'}}>
        <h3 style={{color:'#f87171',marginBottom:'15px'}}>📌 Review These</h3>
        {mistakes.map((m,i)=>(
          <div key={i} style={{margin:'15px 0',padding:'15px',background:'rgba(239,68,68,0.1)',borderRadius:'12px',borderLeft:'4px solid #ef4444'}}>
            <p style={{fontWeight:'bold'}}>{m.question}</p>
            <p style={{fontSize:'0.9rem'}}>Correct: <span style={{color:'#4ade80'}}>{m.correct}</span></p>
            <p style={{fontSize:'0.85rem',color:'#cbd5e1'}}>💡 {m.reason}</p>
          </div>
        ))}
      </div>}
      <button onClick={()=>{setCurrentQ(0);setSelected(null);setIsAnswered(false);setScore(0);setIsComplete(false);setMistakes([]);}}
        style={{display:'block',margin:'30px auto 0',background:'#3b82f6',color:'#fff',padding:'14px 40px',borderRadius:'50px',fontWeight:'bold',border:'none',cursor:'pointer'}}>Retake Quiz</button>
    </motion.div>
  );
  return (
    <div style={{textAlign:'left',maxWidth:'850px',margin:'auto',background:'rgba(15,23,42,0.8)',padding:'40px',borderRadius:'24px',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(15px)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
        <p style={{color:'#94a3b8'}}>{currentQ+1} / {questions.length}</p>
        <p style={{color:'#4ade80'}}>Score: {score}</p>
      </div>
      <div style={{width:'100%',height:'4px',background:'#1e293b',borderRadius:'99px',marginBottom:'25px'}}>
        <div style={{width:`${(currentQ/questions.length)*100}%`,height:'100%',background:'#3b82f6',borderRadius:'99px',transition:'0.3s'}}/>
      </div>
      <h3 style={{marginBottom:'30px',fontSize:'1.4rem',fontWeight:'700',lineHeight:'1.5'}}>{q.question}</h3>
      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        {q.options.map((opt,i)=>{
          const letter=opt.trim().charAt(0);
          const bg=(isAnswered&&letter===q.correct)?'rgba(34,197,94,0.3)':(isAnswered&&selected===letter)?'rgba(239,68,68,0.3)':(selected===letter)?'#3b82f6':'rgba(30,41,59,0.6)';
          return <button key={i} disabled={isAnswered} onClick={()=>setSelected(letter)}
            style={{textAlign:'left',padding:'18px 20px',borderRadius:'14px',background:bg,border:'1px solid rgba(255,255,255,0.08)',color:'#fff',cursor:isAnswered?'default':'pointer',transition:'0.2s'}}>{opt}</button>;
        })}
      </div>
      {isAnswered&&<p style={{marginTop:'20px',color:'#94a3b8',fontStyle:'italic'}}>💡 {q.reason}</p>}
      <div style={{marginTop:'30px',textAlign:'right'}}>
        {!isAnswered
          ?<button onClick={checkAnswer} disabled={!selected} style={{background:'#3b82f6',color:'#fff',padding:'14px 45px',borderRadius:'50px',fontWeight:'bold',border:'none',cursor:selected?'pointer':'not-allowed',opacity:selected?1:0.4}}>Check Answer</button>
          :<button onClick={()=>currentQ<questions.length-1?(setCurrentQ(currentQ+1),setSelected(null),setIsAnswered(false)):setIsComplete(true)}
            style={{background:'#3b82f6',color:'#fff',padding:'14px 45px',borderRadius:'50px',fontWeight:'bold',border:'none',cursor:'pointer'}}>{currentQ<questions.length-1?'Next →':'See Results 🎯'}</button>}
      </div>
    </div>
  );
}

/* ── MIND MAP ── */
const MindMapNode=({data})=>(<div style={{padding:'14px 28px',borderRadius:'50px',background:data.isRoot?'#3b82f6':'#1e293b',color:'#fff',border:'1px solid #334155',textAlign:'center'}}><Handle type="target" position={Position.Left}/>{data.label}<Handle type="source" position={Position.Right}/></div>);
function MindMapVisualizer({data}){
  const{fitView}=useReactFlow();
  const{nodes,edges}=useMemo(()=>{
    const nodes=[],edges=[],lastDepthNodes={};
    data.split('\n').filter(l=>l.trim()).forEach((line,index)=>{
      const isRoot=line.includes("Main Topic:"),depth=line.search(/\S/)/2,nodeId=`node-${index}`;
      nodes.push({id:nodeId,type:'mindMapNode',data:{label:line.trim().replace('Main Topic:','').replace('├','').replace('└',''),isRoot},position:{x:depth*450,y:index*100}});
      if(depth>0&&lastDepthNodes[depth-1])edges.push({id:`e-${index}`,source:lastDepthNodes[depth-1],target:nodeId,animated:true,style:{stroke:'#3b82f6'}});
      lastDepthNodes[depth]=nodeId;
    });
    return{nodes,edges};
  },[data]);
  useEffect(()=>{setTimeout(()=>fitView({padding:0.2}),200);},[data,fitView]);
  return <ReactFlow nodes={nodes} edges={edges} nodeTypes={{mindMapNode:MindMapNode}} colorMode="dark"><Background color="transparent"/><Controls/></ReactFlow>;
}

/* ── FLASHCARDS ── */
function StudyCard({front,back,index,total}){
  const[flipped,setFlipped]=useState(false);const ref=useRef(null);
  const rotateX=useSpring(useMotionValue(0),springValues);const rotateY=useSpring(useMotionValue(0),springValues);
  return(
    <div style={{perspective:"1000px",cursor:"pointer",height:"260px"}}
      onMouseMove={(e)=>{if(!ref.current||flipped)return;const r=ref.current.getBoundingClientRect();rotateX.set(((e.clientY-r.top-r.height/2)/(r.height/2))*-15);rotateY.set(((e.clientX-r.left-r.width/2)/(r.width/2))*15);}}
      onMouseLeave={()=>{rotateX.set(0);rotateY.set(0);}} onClick={()=>setFlipped(!flipped)}>
      <motion.div ref={ref} style={{width:"100%",height:"100%",rotateX,rotateY,transformStyle:"preserve-3d",position:"relative"}} animate={{rotateY:flipped?180:0}} transition={{duration:0.5}}>
        <div style={{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",background:"rgba(255,255,255,0.95)",borderRadius:"20px",display:"flex",alignItems:"center",justifyContent:"center",color:"#1e40af",padding:"30px",textAlign:"center"}}>
          <span style={{position:'absolute',top:'15px',right:'15px',fontSize:'0.8rem',color:'#94a3b8'}}>{index+1}/{total}</span>
          <strong style={{fontSize:'1.1rem'}}>{front}</strong>
        </div>
        <div style={{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"#fff",borderRadius:"20px",display:"flex",alignItems:"center",justifyContent:"center",transform:"rotateY(180deg)",padding:"30px",textAlign:"center"}}>
          <p style={{lineHeight:'1.6'}}>{back}</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── MAIN APP ── */
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const[file,setFile]=useState(null);const[pdfText,setPdfText]=useState("");
  const[result,setResult]=useState("");const[currentType,setCurrentType]=useState("");
  const[loading,setLoading]=useState(false);const[chatOpen,setChatOpen]=useState(false);
  const[chatInput,setChatInput]=useState("");const[chatHistory,setChatHistory]=useState([]);
  const[chatLoading,setChatLoading]=useState(false);const chatEndRef=useRef(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  const auraColors={
    idle:'rgba(59,130,246,0.4)',summary:'rgba(168,85,247,0.4)',quiz:'rgba(239,68,68,0.4)',
    flashcards:'rgba(34,197,94,0.4)',mindmap:'rgba(251,191,36,0.4)',explain:'rgba(236,72,153,0.4)',
  };

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[chatHistory]);

  const uploadFile=async()=>{
    if(!file)return alert("Select a file first!");setLoading(true);
    const fd=new FormData();fd.append("file",file);
    try{const res=await fetch(`${API}/upload`,{method:"POST",body:fd});const d=await res.json();setPdfText(d.text);alert("Uploaded! 📄");}
    catch(e){alert("Upload failed.");}finally{setLoading(false);}
  };

  const runAI=async(type)=>{
    if(!pdfText)return alert("Upload a document first!");
    setLoading(true);setCurrentType(type);setResult("");
    try{const res=await fetch(`${API}/ask-ai`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,context:pdfText})});const d=await res.json();setResult(d.answer);}
    catch(e){setResult("AI Error.");}finally{setLoading(false);}
  };

  const handleChat=async(e)=>{
    e.preventDefault();if(!chatInput.trim()||!pdfText)return;
    const userMsg={role:"user",text:chatInput};setChatHistory(prev=>[...prev,userMsg]);setChatLoading(true);
    const q=chatInput;setChatInput("");
    try{
      const res=await fetch(`${API}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q,context:pdfText,history:chatHistory})});
      const data=await res.json();if(data.answer)setChatHistory(prev=>[...prev,{role:"ai",text:data.answer}]);
    }catch(e){setChatHistory(prev=>[...prev,{role:"ai",text:"Error. Check server."}]);}
    finally{setChatLoading(false);}
  };

  const buttons=[{key:"summary",label:"📋 Summary"},{key:"quiz",label:"🧪 Quiz"},{key:"flashcards",label:"🃏 Flashcards"},{key:"mindmap",label:"🗺️ Mind Map"},{key:"explain",label:"🧠 ELI5"}];

  if (authLoading) return <div style={{minHeight:'100vh',background:'#070b14'}}/>;
  if (!user) return <Auth onLogin={()=>{}} />;

  return(
    <div style={{textAlign:"center",padding:"40px",minHeight:"100vh",color:'#fff',fontFamily:'Inter,sans-serif'}}>
      <RestoredWaves lineColor={auraColors[currentType]||auraColors.idle}/>
      <div style={{position:'relative',zIndex:1}}>
        <div style={{position:'absolute',top:0,right:0,display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{color:'#94a3b8',fontSize:'0.85rem'}}>👋 {user.email}</span>
          <button onClick={()=>signOut(auth)} style={{background:'rgba(239,68,68,0.2)',color:'#f87171',border:'1px solid rgba(239,68,68,0.3)',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'0.85rem'}}>Sign Out</button>
        </div>
        <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}}
          style={{background:'linear-gradient(to right,#60a5fa,#a855f7)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontSize:'3.5rem',fontWeight:'900',marginBottom:'8px'}}>
          StudySphere AI
        </motion.h1>
        <p style={{color:'#475569',marginBottom:'40px'}}>Your AI-Powered Second Brain 🧠</p>

        <div style={{background:"rgba(15,23,42,0.4)",padding:"30px",borderRadius:"24px",display:"inline-flex",alignItems:"center",gap:"20px",marginBottom:"40px",border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(10px)'}}>
          <input type="file" id="file-upload" accept=".pdf" onChange={(e)=>setFile(e.target.files[0])} style={{display:'none'}}/>
          <label htmlFor="file-upload" style={{background:'rgba(255,255,255,0.05)',color:'#fff',padding:'12px 24px',borderRadius:'12px',border:'1px dashed rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'0.9rem'}}>
            {file?`📄 ${file.name}`:"📁 Choose Study Material"}
          </label>
          <button onClick={uploadFile} disabled={!file||loading}
            style={{background:file?'#3b82f6':'rgba(59,130,246,0.3)',color:'#fff',border:'none',padding:'12px 30px',borderRadius:'12px',fontWeight:'bold',cursor:file?'pointer':'not-allowed',transition:'0.3s'}}>
            {loading?"Uploading...":"Lock In 🔒"}
          </button>
          {pdfText&&<span style={{color:'#4ade80',fontSize:'0.85rem'}}>✅ Ready</span>}
        </div>

        <div style={{display:"flex",justifyContent:"center",gap:"12px",marginBottom:"40px",flexWrap:'wrap'}}>
          {buttons.map(({key,label})=>(
            <motion.button key={key} whileHover={{scale:1.05}} whileTap={{scale:0.95}}
              onClick={()=>key==='explain'?setCurrentType('explain'):runAI(key)}
              style={{padding:'14px 24px',borderRadius:'12px',background:currentType===key?'#3b82f6':'rgba(30,41,59,0.8)',color:'#fff',border:currentType===key?'1px solid #60a5fa':'1px solid rgba(255,255,255,0.05)',cursor:'pointer',fontWeight:'bold',fontSize:'0.9rem'}}>
              {label}
            </motion.button>
          ))}
        </div>

        <div style={{maxWidth:"1200px",margin:"auto"}}>
          {loading?(
            <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{background:"rgba(15,23,42,0.4)",padding:"60px",borderRadius:"24px",border:'1px solid rgba(255,255,255,0.1)'}}>
              <div style={{fontSize:'2rem',marginBottom:'15px'}}>✨</div>
              <p style={{color:'#94a3b8',fontSize:'1.1rem'}}>AI is generating your {currentType}...</p>
            </motion.div>
          ):currentType==="explain"?<ELI5View pdfText={pdfText}/>
          :currentType==="summary"&&result?<SummaryView data={result}/>
          :currentType==="quiz"&&result?<QuizView data={result}/>
          :currentType==="flashcards"&&result?(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:"30px"}}>
              {result.split("\n").filter(l=>l.includes("|")).map((l,i,arr)=>{const[f,b]=l.split("|");return<StudyCard key={i} front={f.replace("Front:","").trim()} back={b.replace("Back:","").trim()} index={i} total={arr.length}/>;})}</div>
          ):currentType==="mindmap"&&result?(
            <div style={{height:'700px',background:'rgba(15,23,42,0.7)',borderRadius:'24px',overflow:'hidden',border:'1px solid #334155'}}>
              <ReactFlowProvider><MindMapVisualizer data={result}/></ReactFlowProvider></div>
          ):(
            <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{background:"rgba(15,23,42,0.4)",padding:"60px",borderRadius:"24px",border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(12px)'}}>
              <p style={{fontSize:'3rem',marginBottom:'15px'}}>🌐</p>
              <p style={{color:'#94a3b8',fontSize:'1.1rem'}}>Upload a document and select a mode to begin</p>
              <p style={{color:'#334155',fontSize:'0.85rem',marginTop:'10px'}}>Summary · Quiz · Flashcards · Mind Map · ELI5</p>
            </motion.div>
          )}
        </div>
      </div>

      <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={()=>setChatOpen(!chatOpen)}
        style={{position:'fixed',bottom:'30px',right:'30px',width:'60px',height:'60px',borderRadius:'50%',background:'#3b82f6',color:'#fff',border:'none',cursor:'pointer',fontSize:'1.5rem',boxShadow:'0 10px 25px rgba(59,130,246,0.4)',zIndex:1000}}>
        {chatOpen?"✕":"💬"}
      </motion.button>

      <AnimatePresence>
        {chatOpen&&(
          <motion.div initial={{x:400}} animate={{x:0}} exit={{x:400}} transition={{type:'spring',damping:25}}
            style={{position:'fixed',top:0,right:0,width:'380px',height:'100vh',background:'rgba(7,11,20,0.98)',backdropFilter:'blur(12px)',borderLeft:'1px solid #1e293b',zIndex:999,padding:'20px',display:'flex',flexDirection:'column',textAlign:'left',boxSizing:'border-box'}}>
            <h2 style={{color:'#60a5fa',marginTop:'40px',marginBottom:'5px'}}>AI Study Tutor 🤖</h2>
            <p style={{color:'#475569',fontSize:'0.8rem',marginBottom:'15px'}}>Ask anything about your document</p>
            <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:'12px',paddingRight:'5px'}}>
              {chatHistory.length===0&&<p style={{color:'#334155',fontSize:'0.9rem',marginTop:'20px'}}>💬 Ask a question about your uploaded document!</p>}
              {chatHistory.map((msg,i)=>(
                <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                  style={{alignSelf:msg.role==='user'?'flex-end':'flex-start',background:msg.role==='user'?'#3b82f6':'rgba(255,255,255,0.05)',padding:'12px 16px',borderRadius:'15px',maxWidth:'85%',fontSize:'0.88rem',border:msg.role==='user'?'none':'1px solid #1e293b',lineHeight:'1.5'}}>
                  {msg.text}
                </motion.div>
              ))}
              {chatLoading&&<div style={{color:'#475569',fontSize:'0.8rem'}}>● thinking...</div>}
              <div ref={chatEndRef}/>
            </div>
            <form onSubmit={handleChat} style={{display:'flex',gap:'10px',paddingTop:'15px',paddingBottom:'20px',borderTop:'1px solid #1e293b'}}>
              <input value={chatInput} onChange={(e)=>setChatInput(e.target.value)} placeholder="Ask a question..."
                style={{flex:1,padding:'12px',borderRadius:'10px',background:'#0f172a',border:'1px solid #1e293b',color:'#fff',outline:'none',fontSize:'0.9rem'}}/>
              <button type="submit" style={{background:'#3b82f6',color:'#fff',border:'none',padding:'10px 18px',borderRadius:'10px',fontWeight:'bold',cursor:'pointer'}}>→</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}