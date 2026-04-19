interface Props {
  streak: number;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
}

export default function StreakBadge({ streak, size = "sm", showLabel = false }: Props) {
  if (!streak || streak < 2) return null;

  const isMilestone = [3, 5, 10, 25, 50].includes(streak);
  const textSize = size === "xs" ? "text-[10px]" : size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-bold ${textSize} ${
        isMilestone ? "text-yellow-400" : "text-orange-400"
      }`}
      title={`${streak}-event attendance streak`}
    >
      🔥
      <span>{streak}</span>
      {showLabel && <span className="font-normal opacity-70">streak</span>}
    </span>
  );
}
