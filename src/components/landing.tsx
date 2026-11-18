// Public E-commetrics site home (ported from the Astro site). The other marketing pages live in src/app/(site).
import SiteShell from "@/site/components/SiteShell";
import Hero from "@/site/components/home/Hero";
import Proof from "@/site/components/home/Proof";
import ValueProp from "@/site/components/home/ValueProp";
import Services from "@/site/components/home/Services";
import CostComparator from "@/site/components/home/CostComparator";
import Process from "@/site/components/home/Process";
import Work from "@/site/components/home/Work";
import Testimonials from "@/site/components/home/Testimonials";
import Pricing from "@/site/components/home/Pricing";
import About from "@/site/components/home/About";
import Faq from "@/site/components/home/Faq";
import FinalCta from "@/site/components/FinalCta";

export default function Landing() {
  return (
    <SiteShell>
      <Hero />
      <Proof />
      <ValueProp />
      <Services />
      <CostComparator />
      <Process />
      <Work />
      <Testimonials />
      <Pricing />
      <About />
      <Faq />
      <FinalCta />
    </SiteShell>
  );
}
