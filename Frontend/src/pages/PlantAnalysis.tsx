import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AIAssistant } from "@/components/AIAssistant";

const PlantAnalysis = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <AIAssistant />
      </main>
      <Footer />
    </div>
  );
};

export default PlantAnalysis;
