import type { Metadata } from "next";
import { LandingNav }         from "@/components/landing/LandingNav";
import { HeroSection }        from "@/components/landing/HeroSection";
import { PlatformSection }    from "@/components/landing/PlatformSection";
import { SimulatorsSection }  from "@/components/landing/SimulatorsSection";
import { FeaturesSection }    from "@/components/landing/FeaturesSection";
import { PlansSection }       from "@/components/landing/PlansSection";
import { HowItWorksSection }  from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { ContactSection }     from "@/components/landing/ContactSection";
import { LandingFooter }      from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Naviora — Maritime Assessment & Simulator Management Platform",
  description:
    "Create exercises, conduct assessments, integrate simulators and generate competency reports from one unified maritime training platform by Blue Stratum.",
  robots: { index: true, follow: true },
};

export default function LandingPage() {
  return (
    <div style={{ background: "#0B0B0F" }}>
      <LandingNav />
      <HeroSection />
      <PlatformSection />
      <SimulatorsSection />
      <FeaturesSection />
      <PlansSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <ContactSection />
      <LandingFooter />
    </div>
  );
}
