import { useEffect } from "react";
import { Navbar, HeroSection } from "./landing/HeroSection";
import { LogoStrip } from "./landing/BottomSections";
import { FeaturesSection } from "./landing/FeaturesSection";
import { FlowSection } from "./landing/FlowSection";
import { PowersSection } from "./landing/PowersSection";
import { StatsSection, CTASection, Footer } from "./landing/BottomSections";

type LandingPageProps = {
  isAuthenticated?: boolean;
  username?: string;
};

export function LandingPage({
  isAuthenticated = false,
  username,
}: LandingPageProps) {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-landing-reveal]"),
    );

    elements
      .filter((element) => element.dataset.landingReveal === "hero")
      .forEach((element) => {
        window.setTimeout(() => {
          element.classList.add("is-visible");
        }, 60);
      });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" },
    );

    elements
      .filter((element) => element.dataset.landingReveal !== "hero")
      .forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <main className="min-h-full overflow-x-hidden bg-[var(--background)] text-[var(--on-background)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_10%,rgba(0,255,255,0.08),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(224,141,255,0.09),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(224,141,255,0.08),transparent_30%)]" />

      <Navbar
        isAuthenticated={isAuthenticated}
        username={username}
      />
      <HeroSection
        isAuthenticated={isAuthenticated}
        username={username}
      />
      <LogoStrip />
      <FeaturesSection />
      <FlowSection />
      <PowersSection />
      <StatsSection />
      <CTASection isAuthenticated={isAuthenticated} username={username} />
      <Footer />
    </main>
  );
}
