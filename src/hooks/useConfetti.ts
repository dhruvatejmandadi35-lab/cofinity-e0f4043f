import confetti from "canvas-confetti";

export function useConfetti() {
  const fireBadge = () => {
    confetti({
      particleCount: 120,
      spread: 65,
      origin: { y: 0.6 },
      colors: ["#fbbf24", "#f59e0b", "#fcd34d", "#6366f1"],
    });
  };

  const fireStreak = () => {
    confetti({
      particleCount: 160,
      spread: 75,
      origin: { y: 0.5 },
      colors: ["#f97316", "#fb923c", "#fed7aa", "#fbbf24"],
    });
  };

  const fireMilestone = () => {
    const end = Date.now() + 600;
    (function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#6366f1", "#8b5cf6"] });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#6366f1", "#8b5cf6"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const fireLeaderboard = () => {
    confetti({
      particleCount: 200,
      spread: 80,
      origin: { y: 0.4 },
      colors: ["#fbbf24", "#6366f1", "#8b5cf6", "#ec4899"],
    });
  };

  return { fireBadge, fireStreak, fireMilestone, fireLeaderboard };
}
