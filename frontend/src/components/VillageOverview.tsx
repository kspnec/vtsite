export default function VillageOverview() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-16 pb-12 relative z-10">
        {/* Hero */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-6xl mb-6 animate-float shadow-[0_0_60px_rgba(52,211,153,0.2)]">
            🌿
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-100 mb-5 leading-tight">
            Welcome to{" "}
            <span className="gradient-text">VTRockers</span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
            One village. Countless stories. A community rooted in tradition,
            growing toward the future — together.
          </p>
        </div>

        {/* Strength Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14">
          <StrengthCard
            emoji="🌾"
            color="emerald"
            title="Rich in Agriculture"
            desc="Our fertile lands have sustained generations. From paddy fields to vegetable gardens, our farmers are the backbone of VTRockers."
            stats={[{ label: "Farming Families", value: "200+" }, { label: "Acres Cultivated", value: "500+" }]}
          />
          <StrengthCard
            emoji="🎓"
            color="cyan"
            title="Rising Educators"
            desc="Our youth are conquering universities, earning degrees, and bringing back knowledge to uplift the next generation of our village."
            stats={[{ label: "College Students", value: "80+" }, { label: "Graduates", value: "300+" }]}
          />
          <StrengthCard
            emoji="🏆"
            color="purple"
            title="Spirit of Unity"
            desc="From village festivals to community projects, VTRockers comes together as one. Our strength is in our togetherness."
            stats={[{ label: "Active Initiatives", value: "12+" }, { label: "Events per Year", value: "20+" }]}
          />
        </div>

        {/* Photo Mosaic */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-14">
          {VILLAGE_SCENES.map((scene, i) => (
            <div
              key={i}
              className="glass rounded-2xl aspect-square flex flex-col items-center justify-center gap-2 hover:border-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              <span className="text-4xl sm:text-5xl">{scene.emoji}</span>
              <span className="text-xs text-slate-400 text-center px-2">{scene.label}</span>
            </div>
          ))}
        </div>

        {/* Quote / Tagline */}
        <div className="glass rounded-3xl p-8 text-center max-w-3xl mx-auto border border-cyan-500/10">
          <div className="text-3xl mb-4">🌟</div>
          <blockquote className="text-xl text-slate-200 font-medium italic leading-relaxed mb-3">
            &ldquo;A village that remembers its roots will always find its way to the sky.&rdquo;
          </blockquote>
          <p className="text-sm text-slate-500">— The Spirit of VTRockers</p>
        </div>
      </div>
    </section>
  );
}

function StrengthCard({ emoji, color, title, desc, stats }: {
  emoji: string;
  color: "emerald" | "cyan" | "purple";
  title: string;
  desc: string;
  stats: { label: string; value: string }[];
}) {
  const colors = {
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-300",
    cyan:    "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-300",
    purple:  "from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-300",
  };
  return (
    <div className={`rounded-2xl p-6 bg-gradient-to-br border ${colors[color]} flex flex-col gap-3`}>
      <div className="text-4xl">{emoji}</div>
      <h3 className="text-lg font-bold text-slate-100">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed flex-1">{desc}</p>
      <div className="flex gap-4 pt-2 border-t border-white/5">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-lg font-bold text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const VILLAGE_SCENES = [
  { emoji: "🌅", label: "Morning Sunrise" },
  { emoji: "🛕", label: "Village Temple" },
  { emoji: "🌳", label: "Ancient Banyan" },
  { emoji: "🎭", label: "Cultural Fest" },
  { emoji: "⚽", label: "Sports Ground" },
  { emoji: "👨‍🌾", label: "Farmers Pride" },
  { emoji: "📚", label: "Village School" },
  { emoji: "🤝", label: "Community Bond" },
];
