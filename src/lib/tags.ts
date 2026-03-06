const TAG_COLORS = [
  "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
  "bg-sky-500/10 text-sky-200 border-sky-500/30",
  "bg-amber-500/10 text-amber-200 border-amber-500/30",
  "bg-violet-500/10 text-violet-200 border-violet-500/30",
  "bg-rose-500/10 text-rose-200 border-rose-500/30",
];

export function getTagColorClasses(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
}

