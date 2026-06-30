import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

/* ─── types ─── */
interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

/* ─── 3D scene ─── */
type Vec3 = [number, number, number];

interface Face {
  verts: Vec3[];
  color: string;
  label?: string;
}

function project(v: Vec3, rx: number, ry: number, cx: number, cy: number): [number, number] {
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const [x, y, z] = v;
  // rotate Y
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  // rotate X
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  const scale = 380 / (z2 + 8);
  return [cx + x1 * scale, cy - y2 * scale];
}

function buildBuilding(activeLayer: string): Face[] {
  const faces: Face[] = [];

  const floors = [
    { y0: -2, y1: -1, risk: false },
    { y0: -1, y1: 0,  risk: false },
    { y0: 0,  y1: 1,  risk: true  },  // réseau technique — retard
    { y0: 1,  y1: 2,  risk: true  },  // réseau technique — retard
    { y0: 2,  y1: 3,  risk: false },
    { y0: 3,  y1: 4,  risk: false },
  ];

  const showStructure = activeLayer === 'all' || activeLayer === 'structure';
  const showNetworks  = activeLayer === 'all' || activeLayer === 'networks';
  const showFinish    = activeLayer === 'all' || activeLayer === 'finish';

  floors.forEach(({ y0, y1, risk }) => {
    const isRisk = risk && showNetworks;
    const wallColor  = isRisk ? 'rgba(220,50,50,0.82)' : showStructure ? 'rgba(59,130,246,0.72)' : 'rgba(59,130,246,0.18)';
    const floorColor = showFinish ? 'rgba(148,163,184,0.55)' : 'rgba(148,163,184,0.18)';
    const stroke = isRisk ? '#ef4444' : '#3b82f6';

    // front face
    faces.push({ verts: [[-1.5,y0,-1.5],[ 1.5,y0,-1.5],[ 1.5,y1,-1.5],[-1.5,y1,-1.5]], color: wallColor, label: isRisk ? 'Retard réseau' : undefined });
    // right face
    faces.push({ verts: [[ 1.5,y0,-1.5],[ 1.5,y0, 1.5],[ 1.5,y1, 1.5],[ 1.5,y1,-1.5]], color: wallColor });
    // back
    faces.push({ verts: [[ 1.5,y0, 1.5],[-1.5,y0, 1.5],[-1.5,y1, 1.5],[ 1.5,y1, 1.5]], color: wallColor });
    // left
    faces.push({ verts: [[-1.5,y0, 1.5],[-1.5,y0,-1.5],[-1.5,y1,-1.5],[-1.5,y1, 1.5]], color: wallColor });
    // floor slab
    faces.push({ verts: [[-1.5,y0,-1.5],[ 1.5,y0,-1.5],[ 1.5,y0, 1.5],[-1.5,y0, 1.5]], color: floorColor });
    // window strip (structure layer)
    if (showStructure && y1 - y0 === 1) {
      const wc = isRisk ? 'rgba(255,180,180,0.35)' : 'rgba(186,230,253,0.35)';
      const ym = (y0 + y1) / 2;
      faces.push({ verts: [[-1.0,ym-0.25,-1.51],[ 1.0,ym-0.25,-1.51],[ 1.0,ym+0.25,-1.51],[-1.0,ym+0.25,-1.51]], color: wc });
    }
  });

  // roof
  faces.push({ verts: [[-1.5,4,-1.5],[1.5,4,-1.5],[1.5,4,1.5],[-1.5,4,1.5]], color: 'rgba(100,116,139,0.6)' });

  return faces;
}

function avgZ(verts: Vec3[], rx: number, ry: number): number {
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  return verts.reduce((s, [x, y, z]) => {
    const z1 = -x * sinY + z * cosY;
    return s + y * sinX + z1 * cosX;
  }, 0) / verts.length;
}

function Scene3D({ activeLayer }: { activeLayer: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef({ rx: 0.35, ry: -0.55 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function draw() {
      const { rx, ry } = rotRef.current;
      const W = canvas!.width, H = canvas!.height;
      ctx.clearRect(0, 0, W, H);

      // subtle grid floor
      ctx.strokeStyle = 'rgba(59,130,246,0.08)';
      ctx.lineWidth = 0.5;
      for (let i = -5; i <= 5; i++) {
        const a = project([i * 0.6, -2, -3], rx, ry, W / 2, H / 2);
        const b = project([i * 0.6, -2,  3], rx, ry, W / 2, H / 2);
        const c = project([-3, -2, i * 0.6], rx, ry, W / 2, H / 2);
        const d = project([ 3, -2, i * 0.6], rx, ry, W / 2, H / 2);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
      }

      const faces = buildBuilding(activeLayer);
      // painter's algorithm
      faces.sort((a, b) => avgZ(b.verts, rx, ry) - avgZ(a.verts, rx, ry));

      faces.forEach(f => {
        const pts = f.verts.map(v => project(v, rx, ry, W / 2, H / 2));
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        ctx.fillStyle = f.color;
        ctx.fill();
        ctx.strokeStyle = f.color.includes('220,50') ? 'rgba(239,68,68,0.9)' : 'rgba(59,130,246,0.3)';
        ctx.lineWidth = f.color.includes('220,50') ? 1.5 : 0.7;
        ctx.stroke();

        // label on risk faces
        if (f.label) {
          const cx2 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
          const cy2 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px IBM Plex Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(f.label, cx2, cy2 + 4);
        }
      });
    }

    function loop() { draw(); rafRef.current = requestAnimationFrame(loop); }
    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeLayer]);

  // drag to rotate
  function onMouseDown(e: React.MouseEvent) {
    dragRef.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    rotRef.current.ry += dx * 0.008;
    rotRef.current.rx += dy * 0.008;
    dragRef.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseUp() { dragRef.current = null; }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={520}
      className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    />
  );
}

/* ─── AI chat mock ─── */
const AI_REPLIES: Record<string, string> = {
  default: "D'après l'analyse BIM, les niveaux 3–4 présentent un retard de 18 jours sur les réseaux techniques. Probabilité de dépassement : 78 %.",
  retard: "Le retard sur les réseaux (niveaux 3–4) est causé par un manque d'équipes et une livraison de matériaux reportée au 14 juillet.",
  rouge: "Les zones rouges indiquent un écart entre l'avancement planifié et réel supérieur à 15 %. Action corrective recommandée sous 5 jours.",
  risque: "Risque élevé : si les réseaux ne sont pas achevés avant le 20 juillet, l'aménagement intérieur sera décalé de 3 semaines.",
};

function getAIReply(msg: string): string {
  const low = msg.toLowerCase();
  if (low.includes('rouge') || low.includes('red')) return AI_REPLIES.rouge;
  if (low.includes('retard') || low.includes('délai')) return AI_REPLIES.retard;
  if (low.includes('risque')) return AI_REPLIES.risque;
  return AI_REPLIES.default;
}

/* ─── Layer config ─── */
const LAYERS = [
  { id: 'all',       label: 'Tous les calques', icon: 'Layers' },
  { id: 'structure', label: 'Structure',         icon: 'Box' },
  { id: 'networks',  label: 'Réseaux',           icon: 'Zap' },
  { id: 'finish',    label: 'Finitions',         icon: 'PaintBucket' },
];

/* ─── Main component ─── */
export default function BIMViewer({ onClose }: { onClose: () => void }) {
  const [activeLayer, setActiveLayer] = useState('all');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: "Bonjour ! Je suis votre assistant BIM IA. Posez-moi des questions sur la maquette ou les zones d'anomalie." },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: getAIReply(userMsg) }]);
      setTyping(false);
    }, 900);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border glass shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary grid place-items-center">
            <Icon name="Box" size={16} className="text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-semibold text-base leading-tight">Maquette BIM · Jumelage numérique</p>
            <p className="text-[11px] text-muted-foreground font-mono">ЖК Quartier Nord · Bâtiment 3 · IFC 2×4</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-success">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
            Synchronisé · il y a 2 min
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border hover:bg-secondary flex items-center justify-center transition"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: layers panel */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-border bg-sidebar/60 p-3 gap-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono px-2 py-1">Calques</p>
          {LAYERS.map(l => (
            <button
              key={l.id}
              onClick={() => setActiveLayer(l.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                activeLayer === l.id
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent'
              }`}
            >
              <Icon name={l.icon} size={15} />
              <span>{l.label}</span>
            </button>
          ))}

          <div className="mt-auto space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono px-2 py-1">Statut</p>
            {[
              { color: 'bg-primary', label: 'Dans les délais' },
              { color: 'bg-destructive', label: 'Retard détecté' },
              { color: 'bg-warning', label: 'Risque modéré' },
              { color: 'bg-success', label: 'Terminé' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
                <span className={`w-2.5 h-2.5 rounded-sm ${s.color}`} />
                {s.label}
              </div>
            ))}
          </div>
        </aside>

        {/* Center: 3D scene */}
        <main className="flex-1 relative bg-gradient-to-br from-slate-50 to-blue-50/40 overflow-hidden min-w-0">
          <Scene3D activeLayer={activeLayer} />

          {/* Legend tooltip */}
          <div className="absolute top-4 left-4 glass rounded-xl px-4 py-3 text-xs max-w-[200px] shadow-sm">
            <div className="flex items-center gap-2 mb-2 font-semibold text-foreground">
              <span className="w-3 h-3 rounded-sm bg-destructive" />
              Zone rouge = Retard
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Écart &gt;15 % entre avancement prévu et réel. Niveaux 3–4 · Réseaux techniques.
            </p>
          </div>

          {/* Compass / controls hint */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[11px] text-muted-foreground font-mono glass rounded-lg px-3 py-2">
            <Icon name="MousePointer2" size={13} />
            Glisser pour faire pivoter
          </div>

          {/* Layer pills (mobile) */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 md:hidden">
            {LAYERS.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] border transition ${
                  activeLayer === l.id ? 'bg-primary text-primary-foreground border-primary' : 'glass text-muted-foreground border-border'
                }`}
              >
                <Icon name={l.icon} size={12} />
                {l.label}
              </button>
            ))}
          </div>
        </main>

        {/* Right: AI chat */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 border-l border-border bg-sidebar/60">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Icon name="Brain" size={16} className="text-accent" />
            <p className="font-display font-semibold text-sm">Assistant IA · BIM</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-secondary text-foreground rounded-bl-sm border border-border'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-secondary border border-border rounded-2xl rounded-bl-sm px-3 py-2">
                  <span className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-border">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Posez une question…"
                className="flex-1 text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition placeholder:text-muted-foreground"
              />
              <button
                onClick={sendMessage}
                className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition shrink-0"
              >
                <Icon name="Send" size={14} />
              </button>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {['Zone rouge ?', 'Retard réseau', 'Risque ?'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-[10px] px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
