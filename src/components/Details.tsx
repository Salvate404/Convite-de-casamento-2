"use client";

import { useEffect, useState } from "react";
import { wedding } from "@/lib/wedding";
import { ScrollReveal } from "./ScrollReveal";

function useCountdown(targetISO: string) {
  const [parts, setParts] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date(`${targetISO}T00:00:00`).getTime();

    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setParts({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetISO]);

  return parts;
}

export function Details() {
  const countdown = useCountdown(wedding.dateISO);

  return (
    <section id="detalhes" className="section details">
      <ScrollReveal>
        <div className="section-ornament" aria-hidden>
          <span />
          <span className="section-ornament-dot" />
          <span />
        </div>
        <p className="section-label">O grande dia</p>
        <h2 className="section-title date-title">{wedding.dateLabel}</h2>
        <p className="section-text">{wedding.detailsNote}</p>
      </ScrollReveal>

      <ScrollReveal delay={0.12} className="countdown">
        {(
          [
            ["dias", countdown.days],
            ["horas", countdown.hours],
            ["min", countdown.minutes],
            ["seg", countdown.seconds],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="countdown-item">
            <strong>{String(value).padStart(2, "0")}</strong>
            <span>{label}</span>
          </div>
        ))}
      </ScrollReveal>
    </section>
  );
}
