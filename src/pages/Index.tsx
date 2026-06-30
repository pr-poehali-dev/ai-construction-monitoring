import { useState } from 'react';
import Icon from '@/components/ui/icon';

const BIM_IMAGE = 'https://cdn.poehali.dev/projects/e377657a-cc08-441a-9835-c20eb1901452/files/6bc717df-a3fc-44a0-8709-c2d86d6b69eb.jpg';

const NAV = [
  { id: 'overview', label: 'Aperçu', icon: 'LayoutDashboard' },
  { id: 'bim', label: 'Maquette BIM', icon: 'Box' },
  { id: 'schedule', label: 'Planning', icon: 'CalendarRange' },
  { id: 'tasks', label: 'Tâches', icon: 'ListChecks' },
  { id: 'analytics', label: 'Analytique', icon: 'TrendingUp' },
  { id: 'reports', label: 'Rapports', icon: 'FileBarChart' },
];

const KPIS = [
  { label: 'Avancement du chantier', value: '64', unit: '%', delta: '+3.2%', trend: 'up', color: 'primary' },
  { label: 'Écart de délais', value: '−6', unit: 'j', delta: 'risque', trend: 'down', color: 'warning' },
  { label: 'Réserves ouvertes', value: '28', unit: '', delta: '−4', trend: 'up', color: 'accent' },
  { label: 'Qualité des travaux', value: '92', unit: '%', delta: '+1.1%', trend: 'up', color: 'success' },
];

const STAGES = [
  { name: 'Démolition', plan: 100, fact: 100, status: 'done' },
  { name: 'Renforcement structurel', plan: 100, fact: 96, status: 'progress' },
  { name: 'Réseaux techniques', plan: 80, fact: 62, status: 'risk' },
  { name: 'Travaux de façade', plan: 45, fact: 40, status: 'progress' },
  { name: 'Aménagement intérieur', plan: 20, fact: 8, status: 'risk' },
  { name: 'Aménagement extérieur', plan: 0, fact: 0, status: 'wait' },
];

const TASKS = [
  { title: 'Fissure dans un mur porteur, section B-4', floor: 'Étage 4', prio: 'Critique', tone: 'destructive', assignee: 'A. Dubois' },
  { title: 'Non-conformité des niveaux de dalle', floor: 'Étage 7', prio: 'Élevé', tone: 'warning', assignee: 'M. Laurent' },
  { title: 'Vérifier l\'étanchéité de la toiture', floor: 'Toiture', prio: 'Moyen', tone: 'primary', assignee: 'D. Martin' },
  { title: 'Remplacement des fenêtres façade Sud', floor: 'Étage 2', prio: 'Faible', tone: 'muted', assignee: 'I. Moreau' },
];

const AI_FORECAST = [
  { label: 'Réseaux techniques', risk: 78, eta: '+9 jours', note: 'Manque d\'équipes · livraison retardée' },
  { label: 'Aménagement intérieur', risk: 64, eta: '+5 jours', note: 'Dépend de l\'achèvement des réseaux' },
  { label: 'Travaux de façade', risk: 22, eta: 'dans les délais', note: 'Rythme stable' },
];

const toneMap: Record<string, string> = {
  primary: 'text-primary',
  accent: 'text-accent',
  warning: 'text-warning',
  success: 'text-success',
  destructive: 'text-destructive',
  muted: 'text-muted-foreground',
};

const bgToneMap: Record<string, string> = {
  done: 'bg-success',
  progress: 'bg-primary',
  risk: 'bg-warning',
  wait: 'bg-muted-foreground/40',
};

function Sparkline({ points, stroke }: { points: number[]; stroke: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 120;
  const h = 36;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9 overflow-visible">
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const Index = () => {
  const [active, setActive] = useState('overview');

  return (
    <div className="min-h-screen flex text-foreground">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-sidebar/80 backdrop-blur-xl sticky top-0 h-screen">
        <div className="px-6 py-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary grid place-items-center glow-primary">
              <Icon name="Building2" size={20} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-display font-bold text-lg leading-none tracking-wide">RENOVA<span className="text-primary">AI</span></p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1">Monitoring OS</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active === n.id
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent'
              }`}
            >
              <Icon name={n.icon} size={18} />
              <span className="font-medium">{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="m-3 p-4 rounded-xl glass">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Sparkles" size={15} className="text-accent" />
            <span className="text-xs font-mono text-accent uppercase tracking-wider">AI Engine</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">Prévision mise à jour il y a 4 min. 2 zones de risque détectées sur les délais.</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 glass border-b border-border px-5 sm:px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
              LIVE · Résidence « Quartier Nord », bâtiment 3
            </div>
            <h1 className="font-display font-semibold text-xl sm:text-2xl mt-1">Suivi de rénovation</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition glow-primary">
              <Icon name="Download" size={16} />
              Exporter le rapport
            </button>
            <div className="w-9 h-9 rounded-full bg-secondary border border-border grid place-items-center font-mono text-sm">PR</div>
          </div>
        </header>

        <div className="p-5 sm:p-8 space-y-8 grid-bg">
          {/* KPI row */}
          <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {KPIS.map((k, i) => (
              <div
                key={k.label}
                className="glass rounded-2xl p-5 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</p>
                <div className="flex items-end gap-1.5 mt-2">
                  <span className={`font-display font-bold text-4xl ${toneMap[k.color]}`}>{k.value}</span>
                  <span className="text-muted-foreground text-sm mb-1.5">{k.unit}</span>
                </div>
                <div className={`mt-2 inline-flex items-center gap-1 text-xs font-mono ${toneMap[k.color]}`}>
                  <Icon name={k.trend === 'up' ? 'ArrowUpRight' : 'ArrowDownRight'} size={13} />
                  {k.delta}
                </div>
              </div>
            ))}
          </section>

          {/* BIM + Forecast */}
          <section className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass rounded-2xl overflow-hidden relative group">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 backdrop-blur border border-border">
                <Icon name="Box" size={15} className="text-primary" />
                <span className="text-xs font-mono uppercase tracking-wider">BIM · Digital Twin</span>
              </div>
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                {['Structure', 'Réseaux', 'Finitions'].map((t, i) => (
                  <span key={t} className={`text-[11px] px-2.5 py-1 rounded-md border ${i === 0 ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground'}`}>{t}</span>
                ))}
              </div>
              <div className="relative h-[340px] sm:h-[420px] overflow-hidden">
                <img src={BIM_IMAGE} alt="Maquette BIM du bâtiment" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-x-0 h-px bg-primary/60 animate-scan" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              </div>
              <div className="px-5 py-4 flex items-center justify-between border-t border-border">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase">Éléments du modèle</p>
                    <p className="font-mono text-lg text-foreground">14 820</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase">Liés aux tâches</p>
                    <p className="font-mono text-lg text-accent">312</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-sm text-primary hover:opacity-80 transition">
                  Ouvrir la 3D <Icon name="Maximize2" size={15} />
                </button>
              </div>
            </div>

            {/* AI Forecast */}
            <div className="glass rounded-2xl p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Brain" size={18} className="text-accent" />
                <h3 className="font-display font-semibold text-lg">Prévision IA des écarts</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-5">Le modèle évalue le risque de dépassement des délais selon les données du chantier.</p>
              <div className="space-y-4 flex-1">
                {AI_FORECAST.map((f) => (
                  <div key={f.label} className="rounded-xl bg-secondary/40 border border-border p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{f.label}</span>
                      <span className={`text-xs font-mono ${f.risk > 60 ? 'text-destructive' : f.risk > 40 ? 'text-warning' : 'text-success'}`}>{f.eta}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-background overflow-hidden">
                      <div
                        className={`h-full rounded-full ${f.risk > 60 ? 'bg-destructive' : f.risk > 40 ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${f.risk}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">{f.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-accent font-mono">
                <Icon name="Activity" size={14} />
                Précision du modèle : 89 %
              </div>
            </div>
          </section>

          {/* Schedule + Tasks */}
          <section className="grid lg:grid-cols-3 gap-6">
            {/* Stages */}
            <div className="lg:col-span-2 glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Icon name="CalendarRange" size={18} className="text-primary" />
                  <h3 className="font-display font-semibold text-lg">Planning · prévu / réalisé</h3>
                </div>
                <span className="text-xs font-mono text-muted-foreground">Q3 2026</span>
              </div>
              <div className="space-y-4">
                {STAGES.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${bgToneMap[s.status]}`} />
                        {s.name}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">{s.fact}% / {s.plan}%</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-secondary/60 overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/30" style={{ width: `${s.plan}%` }} />
                      <div className={`absolute inset-y-0 left-0 rounded-full ${bgToneMap[s.status]}`} style={{ width: `${s.fact}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-muted-foreground/40" /> Prévu</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-primary" /> Réalisé</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-warning" /> Zone de risque</span>
              </div>
            </div>

            {/* Tasks */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Icon name="ListChecks" size={18} className="text-accent" />
                  <h3 className="font-display font-semibold text-lg">Réserves</h3>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-destructive/15 text-destructive">28 ouv.</span>
              </div>
              <div className="space-y-3">
                {TASKS.map((t) => (
                  <div key={t.title} className="rounded-xl bg-secondary/40 border border-border p-3.5 hover:border-primary/40 transition">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-snug">{t.title}</p>
                      <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border border-current ${toneMap[t.tone]}`}>{t.prio}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1"><Icon name="MapPin" size={12} /> {t.floor}</span>
                      <span className="flex items-center gap-1"><Icon name="User" size={12} /> {t.assignee}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Analytics row */}
          <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[
              { title: 'Évolution de l\'avancement', val: '64%', stroke: 'hsl(220 85% 52%)', pts: [30, 34, 38, 41, 47, 52, 58, 64], hint: 'sur 8 semaines' },
              { title: 'Clôture des réserves', val: '+11/sem', stroke: 'hsl(150 65% 38%)', pts: [4, 6, 5, 9, 7, 10, 8, 11], hint: 'rythme en hausse' },
              { title: 'Écart de délais', val: '−6 j', stroke: 'hsl(32 90% 46%)', pts: [-1, -2, -2, -3, -4, -4, -5, -6], hint: 'à surveiller' },
            ].map((c) => (
              <div key={c.title} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">{c.title}</p>
                  <span className="font-display font-semibold text-xl">{c.val}</span>
                </div>
                <Sparkline points={c.pts} stroke={c.stroke} />
                <p className="text-[11px] text-muted-foreground mt-2 font-mono">{c.hint}</p>
              </div>
            ))}
          </section>

          <footer className="text-center text-xs text-muted-foreground font-mono pt-2 pb-4">
            RENOVA AI · Plateforme de suivi de rénovation · données de démonstration
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Index;