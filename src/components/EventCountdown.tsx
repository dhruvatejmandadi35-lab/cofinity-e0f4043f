import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface Props {
  dateTime: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function compute(dateTime: string): TimeLeft | null {
  const diff = new Date(dateTime).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function EventCountdown({ dateTime }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => compute(dateTime));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(compute(dateTime)), 1000);
    return () => clearInterval(id);
  }, [dateTime]);

  if (!timeLeft) return null;

  const units =
    timeLeft.days > 0
      ? [
          { label: "days", value: timeLeft.days },
          { label: "hrs", value: timeLeft.hours },
          { label: "min", value: timeLeft.minutes },
        ]
      : [
          { label: "hrs", value: timeLeft.hours },
          { label: "min", value: timeLeft.minutes },
          { label: "sec", value: timeLeft.seconds },
        ];

  return (
    <div className="glass rounded-xl p-4 border border-primary/20">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-3">
        <Clock className="w-3.5 h-3.5 text-primary" /> Event starts in
      </p>
      <div className="flex items-center gap-3">
        {units.map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-2xl font-bold gradient-text tabular-nums w-14 text-center">
              {String(value).padStart(2, "0")}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
