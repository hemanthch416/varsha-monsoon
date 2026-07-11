import { memo } from "react";

interface HourlyPoint {
  time: string;
  rainMm: number;
  precipProb: number;
}

/** Simple bar chart of rainfall by hour, sized relative to the max in the window. */
export const RainStrip = memo(function RainStrip({ hourly }: { hourly: HourlyPoint[] }) {
  const max = Math.max(1, ...hourly.map(h => h.rainMm));
  return (
    <div className="flex items-end gap-1 h-24">
      {hourly.map(h => {
        const height = Math.max(2, (h.rainMm / max) * 100);
        const hour = new Date(h.time).getHours();
        return (
          <div key={h.time} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm bg-primary/70"
              style={{ height: `${height}%` }}
              title={`${h.rainMm.toFixed(1)}mm · ${h.precipProb}%`}
            />
            <span className="text-[10px] text-muted-foreground">{hour}h</span>
          </div>
        );
      })}
    </div>
  );
});
