import { HeaderLanding } from "@/components/header-landing"
import { HeroLanding } from "@/components/hero-landing"
import { FeatureCards } from "@/components/feature-cards"
import { HowItWorks } from "@/components/how-it-works"
import { DashboardPreview } from "@/components/dashboard-preview"
import { PricingCards } from "@/components/pricing-cards"
import { FooterLanding } from "@/components/footer-landing"
import { WhyChooseUs } from "@/components/WhyChooseUs"
import { FAQ } from "@/components/faq"
import { AlumniProjects } from "@/components/alumni-projects"
import AIMentor from "@/components/AI-section";

export default function RootPage() {
  return (
    <div className="min-h-screen bg-[#FDF6E3]">
      <HeaderLanding />
      <main>
        <HeroLanding />
        
        {/* Missions Section - This should be your FeatureCards or HowItWorks */}
        <section id="missions" className="scroll-mt-20">
          <FeatureCards />
        </section>
        
        <HowItWorks />
        <DashboardPreview />
        
        {/* Why Choose Us Section */}
        <section id="why-choose-us" className="scroll-mt-20">
          <WhyChooseUs />
        </section>
        
        {/* Pricing Section */}
        <section id="pricing" className="scroll-mt-20">
          <PricingCards />
        </section>
        
        {/* Alumni Projects Section */}
        {/* <section id="alumni" className="scroll-mt-20">
          <AlumniProjects />
        </section> */}
        <section id="AI-mentor" className="scroll-mt-20">
          <AIMentor />
        </section>
        {/* FAQ Section */}
        <section id="faq" className="scroll-mt-20">
          <FAQ />
        </section>
        
      </main>
      <FooterLanding />
    </div>
  )
}