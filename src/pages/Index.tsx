import Navbar from "@/components/Navbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingFeatureSlides from "@/components/landing/LandingFeatureSlides";
import LandingLevels from "@/components/landing/LandingLevels";
import LandingStats from "@/components/landing/LandingStats";
import LandingCTA from "@/components/landing/LandingCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LandingHero />
      <LandingStats />
      <LandingFeatureSlides />
      <LandingLevels />
      <LandingCTA />
      <Footer />
    </div>
  );
};

export default Index;
