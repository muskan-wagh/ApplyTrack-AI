import { Backdrop } from '@/components/landing/Backdrop';
import { Faq, FinalCta, Footer, ProductPreview } from '@/components/landing/Closing';
import { Hero } from '@/components/landing/Hero';
import { Navbar } from '@/components/landing/Navbar';
import { Features, HowItWorks, Ticker, Workflow } from '@/components/landing/Sections';

export function LandingPage() {
  return (
    <div className="lm-paper min-h-screen overflow-x-clip">
      <Backdrop />
      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <Ticker />
          <Workflow />
          <ProductPreview />
          <Features />
          <HowItWorks />
          <Faq />
          <FinalCta />
        </main>
        <Footer />
      </div>
    </div>
  );
}
