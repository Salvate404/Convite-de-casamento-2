import { wedding } from "@/lib/wedding";
import { ScrollReveal } from "./ScrollReveal";

export function Story() {
  return (
    <section id="historia" className="section story">
      <ScrollReveal>
        <div className="section-ornament" aria-hidden>
          <span />
          <span className="section-ornament-dot" />
          <span />
        </div>
        <p className="section-label">Nossa história</p>
        <h2 className="section-title">Do encontro ao para sempre</h2>
        <p className="section-text lead">{wedding.story}</p>
      </ScrollReveal>
    </section>
  );
}
