import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { severityBorderClass } from "@/utils/severity";
import type { TravelAssessment } from "@/services/travelAdvisory";

interface StatProps { label: string; value: string }

function Stat({ label, value }: StatProps) {
  return (
    <div>
      <p className="uppercase-label text-muted-foreground mb-1">{label}</p>
      <p className="font-serif text-lg">{value}</p>
    </div>
  );
}

export function AssessmentView({ result }: { result: TravelAssessment }) {
  return (
    <section className={`border-l-2 pl-6 ${severityBorderClass[result.rating]}`}>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SeverityBadge severity={result.rating} />
        <span className="uppercase-label text-muted-foreground">
          {result.origin} → {result.destination}
        </span>
      </div>
      <h3 className="font-serif text-2xl md:text-3xl leading-snug">{result.headline}</h3>
      <p className="mt-4 text-muted-foreground max-w-2xl font-light leading-relaxed">{result.summary}</p>

      {result.destinationNotFound && (
        <p className="mt-4 text-sm text-severity-warning">
          Couldn't locate "{result.destination}" for live weather. Recommendations below are based on the flood-hotspot dataset only.
        </p>
      )}

      <div className="mt-12 grid md:grid-cols-2 gap-x-16 gap-y-10">
        <div>
          <p className="uppercase-label text-muted-foreground mb-4">Recommendations</p>
          <ul className="space-y-3">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="uppercase-label text-muted-foreground mb-4">Hazards on file</p>
          {result.hazards.length === 0 ? (
            <p className="text-sm text-muted-foreground">None recorded for this destination.</p>
          ) : (
            <ul className="space-y-3">
              {result.hazards.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {result.weather && (
        <div className="mt-12 border-t border-border pt-6 grid grid-cols-3 gap-8 max-w-lg">
          <Stat label="Temp" value={`${result.weather.current.tempC}°`} />
          <Stat label="Condition" value={result.weather.current.condition} />
          <Stat label="Rain (24h)" value={`${result.weather.hourly.reduce((s, h) => s + h.rainMm, 0).toFixed(0)}mm`} />
        </div>
      )}
    </section>
  );
}
