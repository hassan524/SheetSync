'use client';
import React from "react";
import Navigation from "@/components/Navigation";
import MbFeaturesSection from "@/components/MbFeaturesSection";
import FeaturesSection from "@/components/FeaturesSection";
import { Button } from "@/components/ui/button";
import { Users, Rocket, Play, Lightbulb, Heart, Globe, Table } from "lucide-react";
import { features } from "@/data/features";
import { faqs } from "@/data/faqs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Home() {
     React.useEffect(() => {
    console.log("🔥 HomePage useEffect running on client");
  }, []);
  return (
    <div className="bg-white">
      {/* Header  */}
      <Navigation />

      {/* ============================================= */}
      {/* ============ Hero Section =================== */}
      {/* ============================================= */}
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
            SheetSync empowers teams to work together seamlessly on spreadsheets
            with real-time collaboration, advanced formulas, and powerful data
            visualization tools. Experience the future of collaborative data
            management.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button className="btn-primary text-white px-8 py-4 text-lg font-semibold h-auto">
              <Rocket className="mr-2 h-5 w-5" />
              Start Free Trial
            </Button>

            <Button
              variant="outline"
              className="bg-white text-primary px-8 py-4 text-lg font-semibold border-2 border-primary hover:bg-primary hover:text-white h-auto"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* ============ Why Teams Section =============== */}
      {/* ============================================= */}
      <section id="why-teams" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Made for All Kinds of Teams
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're building a startup, analyzing trends, or managing
              projects from across the globe, SheetSync adapts to your team.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`card-hover bg-gradient-to-br ${feature.gradient} p-8 rounded-2xl`}
              >
                <div className={`${feature.iconColor} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* ============ Features Section ================ */}
      {/* ============================================= */}
      <div className="hidden lg:block">
        <FeaturesSection />
      </div>

      <div className="block lg:hidden">
        <MbFeaturesSection />
      </div>

      {/* ============================================= */}
      {/* ============ About Section ================== */}
      {/* ============================================= */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-[7rem]">
          {/* Header */}
          <div className="text-center flex flex-col gap-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Meet the Builder Behind SheetSync
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              I'm Hassan, a self-taught full-stack developer passionate about
              creating tools that improve how people collaborate and build.
              SheetSync is a side project born from that passion.
            </p>
          </div>

          {/* Personal Highlights */}
          <div className="flex flex-col lg:flex-row gap-12">
            {/* 1. Creative Problem Solver */}
            <div className="text-center flex flex-col items-center gap-4">
              <div className="bg-green-50 p-6 rounded-full w-24 h-24 flex items-center justify-center">
                <Lightbulb className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Creative Problem Solver
              </h3>
              <p className="text-gray-600 max-w-sm">
                I love building solutions from scratch, exploring modern stacks,
                and turning ideas into clean, working code.
              </p>
            </div>

            {/* 2. Passion for Learning */}
            <div className="text-center flex flex-col items-center gap-4">
              <div className="bg-blue-50 p-6 rounded-full w-24 h-24 flex items-center justify-center">
                <Heart className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Passion for Learning
              </h3>
              <p className="text-gray-600 max-w-sm">
                I've been learning everything myself for years — from UI/UX
                design to full-stack architectures. I'm always curious to learn
                more.
              </p>
            </div>

            {/* 3. Global Vision */}
            <div className="text-center flex flex-col items-center gap-4">
              <div className="bg-purple-50 p-6 rounded-full w-24 h-24 flex items-center justify-center">
                <Globe className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Global Vision
              </h3>
              <p className="text-gray-600 max-w-sm">
                My goal is to build useful products that people anywhere in the
                world can use — simple, beautiful, and powerful.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary to-green-800 text-white p-12 rounded-3xl text-center flex flex-col items-center gap-6">
            <h3 className="text-3xl font-bold">
              Want to Collaborate or Hire Me?
            </h3>
            <p className="text-xl opacity-90 max-w-2xl">
              I'm open to exciting frontend or full-stack opportunities. Let’s
              connect and build something awesome together.
            </p>
            <Button className="bg-white text-primary px-8 py-4 text-lg font-semibold hover:bg-gray-100 h-auto">
              Let's Talk
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* ============ FAQs Section =================== */}
      {/* ============================================= */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Curious about Google Sheets?
            </h2>
            <p className="text-xl text-gray-600">
              Take a look at our FAQs to learn more.
            </p>
          </div>

          {/* Accordion */}
          <div className="p-6 md:p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b border-gray-200 last:border-0"
                >
                  <AccordionTrigger
                    data-testid={`faq-question-${index}`}
                    className="text-left py-4 hover:text-primary transition-colors"
                  >
                    <span className="text-lg text-gray-900 pr-4">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent
                    data-testid={`faq-answer-${index}`}
                    className="text-gray-600 pb-4 pt-2 leading-relaxed"
                  >
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Divider with Text */}
          <div className="mt-12 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-50 px-4 text-sm text-gray-500 font-medium">
                  Still have questions? Contact our support team
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* ============ Footer Section ================= */}
      {/* ============================================= */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* --- Logo & About --- */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <Table className="h-8 w-8 text-primary mr-2" />
                <span className="text-2xl font-bold">SheetSync</span>
              </div>

              <p className="text-gray-400 mb-6 max-w-md">
                Empowering teams worldwide to collaborate seamlessly on data
                through innovative spreadsheet technology.
              </p>

              {/* Social Icons */}
              <div className="flex space-x-4 text-xl">
                <a
                  href="https://github.com/yourusername"
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-github"></i>
                </a>
                <a
                  href="https://linkedin.com/in/yourusername"
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-linkedin"></i>
                </a>
                <a
                  href="https://twitter.com/yourusername"
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-twitter-x"></i>
                </a>
                <a
                  href="https://instagram.com/yourusername"
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-instagram"></i>
                </a>
              </div>
            </div>

            {/* --- Product Links --- */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mobile Apps</a></li>
              </ul>
            </div>

            {/* --- Company Links --- */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* --- Bottom Bar --- */}
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 SheetSync. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
