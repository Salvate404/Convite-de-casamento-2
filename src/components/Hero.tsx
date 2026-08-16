"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { wedding } from "@/lib/wedding";
import { RingsFallback } from "./RingsFallback";

const HeroScene = dynamic(
  () =>
    import("./HeroScene")
      .then((mod) => mod.HeroScene)
      .catch(() => () => (
        <div className="hero-scene" aria-hidden>
          <RingsFallback />
        </div>
      )),
  {
    ssr: false,
    loading: () => (
      <div className="hero-scene" aria-hidden>
        <RingsFallback />
      </div>
    ),
  },
);

type Props = {
  hasPhoto?: boolean;
};

export function Hero({ hasPhoto = false }: Props) {
  const [load3d, setLoad3d] = useState(false);

  useEffect(() => {
    const start = () => setLoad3d(true);
    const idle =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(start, { timeout: 800 })
        : undefined;
    const fallback = window.setTimeout(start, 350);

    return () => {
      if (idle !== undefined) window.cancelIdleCallback(idle);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <section className="hero">
      <div className="hero-media">
        {hasPhoto ? (
          <Image
            src="/couple.jpg"
            alt={`${wedding.bride} e ${wedding.groom}`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="hero-placeholder" />
        )}
        <div className="hero-veil" />
        {load3d ? (
          <HeroScene />
        ) : (
          <div className="hero-scene" aria-hidden>
            <RingsFallback />
          </div>
        )}
      </div>

      <div className="hero-stage">
        <div className="hero-content">
          <p className="hero-kicker">{wedding.dateLabel}</p>

          <h1 className="hero-title">
            <span>{wedding.bride}</span>
            <span className="hero-amp">&</span>
            <span>{wedding.groom}</span>
          </h1>

          <p className="hero-copy">{wedding.supporting}</p>

          <div className="hero-actions">
            <a href="#rsvp" className="btn-primary">
              Confirmar presença
            </a>
            <a href="#detalhes" className="btn-ghost">
              Ver detalhes
            </a>
          </div>
        </div>
      </div>

      <a href="#historia" className="hero-scroll" aria-label="Rolar para a história">
        <span />
      </a>
    </section>
  );
}
