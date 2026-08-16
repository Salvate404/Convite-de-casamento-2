import { Hero } from "@/components/Hero";
import { Story } from "@/components/Story";
import { Details } from "@/components/Details";
import { RsvpForm } from "@/components/RsvpForm";
import { LightBeams } from "@/components/LightBeams";
import { wedding } from "@/lib/wedding";

export default function Home() {
  return (
    <main className="site-main">
      <LightBeams />
      <div className="site-content">
        <Hero hasPhoto={false} />
        <div className="page-body">
          <Story />
          <Details />
          <RsvpForm />
          <footer className="site-footer">
            <p>
              {wedding.coupleShort} · {wedding.dateLabel}
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
