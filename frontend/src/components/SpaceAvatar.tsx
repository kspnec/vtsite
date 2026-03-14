const AVATAR_CONFIGS: Record<string, { bg: string; icon: string; glow: string }> = {
  "cosmos-1": { bg: "from-cyan-400 to-blue-600", icon: "🌌", glow: "rgba(34,211,238,0.4)" },
  "cosmos-2": { bg: "from-purple-400 to-pink-600", icon: "🪐", glow: "rgba(168,85,247,0.4)" },
  "cosmos-3": { bg: "from-emerald-400 to-cyan-600", icon: "⭐", glow: "rgba(52,211,153,0.4)" },
  "cosmos-4": { bg: "from-amber-400 to-orange-600", icon: "☀️", glow: "rgba(251,191,36,0.4)" },
  "cosmos-5": { bg: "from-blue-400 to-indigo-600", icon: "🌠", glow: "rgba(96,165,250,0.4)" },
  "cosmos-6": { bg: "from-rose-400 to-pink-600", icon: "💫", glow: "rgba(251,113,133,0.4)" },
  "cosmos-7": { bg: "from-teal-400 to-emerald-600", icon: "🌍", glow: "rgba(45,212,191,0.4)" },
  "cosmos-8": { bg: "from-violet-400 to-purple-600", icon: "🔭", glow: "rgba(167,139,250,0.4)" },
  "cosmos-9": { bg: "from-sky-400 to-cyan-600", icon: "🚀", glow: "rgba(56,189,248,0.4)" },
  "cosmos-10": { bg: "from-fuchsia-400 to-rose-600", icon: "🌸", glow: "rgba(232,121,249,0.4)" },
  "cosmos-11": { bg: "from-lime-400 to-green-600", icon: "🌱", glow: "rgba(163,230,53,0.4)" },
  "cosmos-12": { bg: "from-orange-400 to-amber-600", icon: "🏆", glow: "rgba(251,146,60,0.4)" },
};

export function SpaceAvatarDisplay({ avatarKey, size = 64, name }: { avatarKey: string; size?: number; name?: string }) {
  const config = AVATAR_CONFIGS[avatarKey];
  if (!config) {
    // Fallback initials avatar
    const initials = (name ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    return (
      <div
        className={`rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0`}
        style={{ width: size, height: size }}
      >
        <span className="text-white font-bold" style={{ fontSize: size * 0.35 }}>{initials}</span>
      </div>
    );
  }
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${config.bg} flex items-center justify-center flex-shrink-0`}
      style={{ width: size, height: size, boxShadow: `0 0 20px ${config.glow}` }}
    >
      <span style={{ fontSize: size * 0.45 }}>{config.icon}</span>
    </div>
  );
}

export function AvatarPicker({ selected, onSelect }: { selected: string | null; onSelect: (key: string) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-300 mb-3">Choose a space avatar</p>
      <div className="grid grid-cols-6 gap-2">
        {Object.keys(AVATAR_CONFIGS).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`rounded-xl p-1 transition-all ${
              selected === key
                ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#030b1a]"
                : "hover:ring-1 hover:ring-white/20"
            }`}
          >
            <SpaceAvatarDisplay avatarKey={key} size={44} />
          </button>
        ))}
      </div>
    </div>
  );
}
