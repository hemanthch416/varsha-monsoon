import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { RECOVERY_GUIDANCE } from "@/config/labels";

export function RecoverySection() {
  return (
    <section className="border-t border-border pt-8">
      <div className="mb-10">
        <p className="uppercase-label text-muted-foreground mb-4">Recovery</p>
        <h3 className="font-serif text-3xl md:text-4xl">After the storm.</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
        {RECOVERY_GUIDANCE.map(g => (
          <article key={g.title}>
            <p className="uppercase-label text-muted-foreground mb-3">{g.title}</p>
            <p className="text-sm leading-relaxed font-light text-foreground/80">{g.body}</p>
          </article>
        ))}
      </div>
      <SafetyDisclaimer className="mt-8" />
    </section>
  );
}
