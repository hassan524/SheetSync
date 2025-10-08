import { Button } from "./ui/button";
import { Users, Rocket, Play } from "lucide-react";

export default function HeroSection() {
  const handleStartTrial = () => {
    alert("Start Free Trial - for demo purposes only!");
  };

  const handleWatchDemo = () => {
    console.log("Watch demo clicked");
  };

  return (
    <section className="hero-gradient h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl flex flex-col gap-4 mx-auto text-center">
        <div className="animate-float mb-2">
          <Users className="h-14 w-14 text-primary mx-auto" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
          Collaborate on{" "}
          <span className="text-primary">Spreadsheets</span>{" "}
          in Real-Time
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          SheetSync empowers teams to work together seamlessly on spreadsheets with real-time collaboration, 
          advanced formulas, and powerful data visualization tools. Experience the future of collaborative data management.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={handleStartTrial}
            className="btn-primary text-white px-8 py-4 text-lg font-semibold h-auto"
          >
            <Rocket className="mr-2 h-5 w-5" />
            Start Free Trial
          </Button>
          <Button
            variant="outline"
            onClick={handleWatchDemo}
            className="bg-white text-primary px-8 py-4 text-lg font-semibold border-2 border-primary hover:bg-primary hover:text-white h-auto"
          >
            <Play className="mr-2 h-5 w-5" />
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
