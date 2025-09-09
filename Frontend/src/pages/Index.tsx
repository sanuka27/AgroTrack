import { Header } from "@/components/Header";
import { WelcomeStrip } from "@/components/WelcomeStrip";
import { Hero } from "@/components/Hero";
import { AIAssistant } from "@/components/AIAssistant";
import { Features } from "@/components/Features";
import { Community } from "@/components/Community";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WelcomeStrip />
      <main>
        <Hero />
        <AIAssistant />
        <Features />
        <Community />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
