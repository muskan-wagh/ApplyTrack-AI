import { Faq, FinalCta, Footer, ProductPreview } from '@/components/landing/Closing';
import { Hero } from '@/components/landing/Hero';
import { Navbar } from '@/components/landing/Navbar';
import { Features, HowItWorks, Overview } from '@/components/landing/Sections';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Overview />
        <Features />
        <HowItWorks />
        <ProductPreview />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
