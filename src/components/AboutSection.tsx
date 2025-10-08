import { Lightbulb, Heart, Globe } from "lucide-react";
import { Button } from "./ui/button";

export default function AboutSection() {
  const handleStartTrial = () => {
    alert("Thanks for checking out my work! 🚀");
  };

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-[7rem]">
        {/* Header */}
        <div className="text-center flex flex-col gap-6">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Meet the Builder Behind SheetSync
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            I'm Hassan, a self-taught full-stack developer passionate about creating tools that improve how people collaborate and build. SheetSync is a side project born from that passion.
          </p>
        </div>

        {/* Three Personal Highlights */}
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="text-center flex flex-col items-center gap-4">
            <div className="bg-green-50 p-6 rounded-full w-24 h-24 flex items-center justify-center">
              <Lightbulb className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Creative Problem Solver</h3>
            <p className="text-gray-600 max-w-sm">
              I love building solutions from scratch, exploring modern stacks, and turning ideas into clean, working code.
            </p>
          </div>

          <div className="text-center flex flex-col items-center gap-4">
            <div className="bg-blue-50 p-6 rounded-full w-24 h-24 flex items-center justify-center">
              <Heart className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Passion for Learning</h3>
            <p className="text-gray-600 max-w-sm">
              I've been learning everything myself for years — from UI/UX design to full-stack architectures. I'm always curious to learn more.
            </p>
          </div>

          <div className="text-center flex flex-col items-center gap-4">
            <div className="bg-purple-50 p-6 rounded-full w-24 h-24 flex items-center justify-center">
              <Globe className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Global Vision</h3>
            <p className="text-gray-600 max-w-sm">
              My goal is to build useful products that people anywhere in the world can use — simple, beautiful, and powerful.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-green-800 text-white p-12 rounded-3xl text-center flex flex-col items-center gap-6">
          <h3 className="text-3xl font-bold">Want to Collaborate or Hire Me?</h3>
          <p className="text-xl opacity-90 max-w-2xl">
            I'm open to exciting frontend or full-stack opportunities. Let’s connect and build something awesome together.
          </p>
          <Button
            onClick={handleStartTrial}
            className="bg-white text-primary px-8 py-4 text-lg font-semibold hover:bg-gray-100 h-auto"
          >
            Let's Talk
          </Button>
        </div>
      </div>
    </section>
  );
}
