"use client";

import type { CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";

const beams = [
  { className: "beam-a", rot: 16, left: "6%" },
  { className: "beam-b", rot: 21, left: "28%" },
  { className: "beam-c", rot: 14, left: "48%" },
  { className: "beam-d", rot: 24, left: "68%" },
  { className: "beam-e", rot: 18, left: "86%" },
] as const;

export function LightBeams() {
  const reduce = useReducedMotion();

  return (
    <div className={`light-beams${reduce ? " is-static" : ""}`} aria-hidden>
      <div className="beam-atmosphere" />
      {beams.map((beam) => (
        <div
          key={beam.className}
          className={`beam ${beam.className}`}
          style={
            {
              "--beam-rot": `${beam.rot}deg`,
              left: beam.left,
            } as CSSProperties
          }
        >
          <span className="beam-soft" />
          <span className="beam-core" />
          <span className="beam-hot" />
        </div>
      ))}
      <div className="beam-dust" />
      <div className="beam-sweep" />
      <div className="beam-sweep beam-sweep-late" />
    </div>
  );
}
