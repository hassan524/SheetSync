"use client";

import {
  Table,
  Shield,
  Twitter,
  Github,
  Linkedin,
  Mail,
  Heart,
} from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-gray-950 text-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
          <div className="col-span-2">
            <div className="flex items-center mb-4">
              <Table className="h-7 w-7 text-primary mr-2" />
              <span className="text-xl font-bold">SheetSync</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 max-w-xs leading-relaxed">
              Cloud spreadsheets built for real-time collaboration. Formulas,
              templates, organizations — all in one beautiful workspace.
            </p>
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs text-gray-500">
                Bank-level data encryption
              </span>
            </div>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Twitter"
                className="h-9 w-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <Twitter className="h-4 w-4 text-gray-400 hover:text-white" />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="h-9 w-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <Github className="h-4 w-4 text-gray-400 hover:text-white" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="h-9 w-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <Linkedin className="h-4 w-4 text-gray-400 hover:text-white" />
              </a>
              <a
                href="mailto:support@sheetsync.app"
                aria-label="Email"
                className="h-9 w-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <Mail className="h-4 w-4 text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 mb-5 uppercase tracking-widest">
              Product
            </h4>
            <ul className="space-y-3">
              {[
                "Features",
                "Templates",
                "Import / Export",
                "Organizations",
                "Activity Log",
              ].map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-white transition-colors text-sm"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 mb-5 uppercase tracking-widest">
              Company
            </h4>
            <ul className="space-y-3">
              {["About", "Blog", "Changelog", "Contact", "Status"].map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-white transition-colors text-sm"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-14 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} SheetSync. All rights reserved.
          </p>
          {/* Made with love */}
          <p className="text-gray-600 text-sm flex items-center gap-1.5">
            Made with{" "}
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> by{" "}
            <span className="text-gray-400 font-medium">Hassan Rehan</span>
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {["Privacy Policy", "Terms of Service", "Security"].map((l) => (
              <a
                key={l}
                href="#"
                className="text-gray-600 hover:text-white text-xs transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

