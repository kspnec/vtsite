// DiceBear "bottts" avatars — robot/space illustrated style.
// Seeds are fixed so each cosmos key always resolves to the same avatar.
const AVATAR_CONFIGS: Record<string, { seed: string; glow: string }> = {
  "cosmos-1":  { seed: "stardust",   glow: "rgba(34,211,238,0.5)" },
  "cosmos-2":  { seed: "nebula",     glow: "rgba(168,85,247,0.5)" },
  "cosmos-3":  { seed: "pulsar",     glow: "rgba(52,211,153,0.5)" },
  "cosmos-4":  { seed: "solaris",    glow: "rgba(251,191,36,0.5)" },
  "cosmos-5":  { seed: "andromeda",  glow: "rgba(96,165,250,0.5)" },
  "cosmos-6":  { seed: "quasar",     glow: "rgba(251,113,133,0.5)" },
  "cosmos-7":  { seed: "vega",       glow: "rgba(45,212,191,0.5)" },
  "cosmos-8":  { seed: "orion",      glow: "rgba(167,139,250,0.5)" },
  "cosmos-9":  { seed: "cassini",    glow: "rgba(56,189,248,0.5)" },
  "cosmos-10": { seed: "lyra",       glow: "rgba(232,121,249,0.5)" },
  "cosmos-11": { seed: "kepler",     glow: "rgba(163,230,53,0.5)" },
  "cosmos-12": { seed: "voyager",    glow: "rgba(251,146,60,0.5)" },
};

function dicebearUrl(seed: string) {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${seed}&backgroundColor=transparent`;
}

export function SpaceAvatarDisplay({ avatarKey, size = 64, name }: { avatarKey: string; size?: number; name?: string }) {
  const config = AVATAR_CONFIGS[avatarKey];
  if (!config) {
    // Fallback initials avatar
    const initials = (name ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    return (
      <div
        className="rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <span className="text-white font-bold" style={{ fontSize: size * 0.35 }}>{initials}</span>
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl bg-[#0a1628] flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ width: size, height: size, boxShadow: `0 0 16px ${config.glow}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dicebearUrl(config.seed)}
        alt={avatarKey}
        width={size}
        height={size}
        style={{ width: "85%", height: "85%", objectFit: "contain" }}
      />
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
