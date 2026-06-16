"use client";

import { Table, Heart, Twitter, Github, Linkedin, Mail } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-12 pb-8 px-5 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Single clean row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Table className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-gray-900">
              SheetSync
            </span>
          </div>

          {/* Socials */}
          <div className="flex gap-2">
            {[
              { icon: Twitter, label: "Twitter" },
              { icon: Github, label: "GitHub" },
              { icon: Linkedin, label: "LinkedIn" },
              {
                icon: Mail,
                label: "Email",
                href: "mailto:support@sheetsync.app",
              },
            ].map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href ?? "#"}
                aria-label={label}
                className="h-9 w-9 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
          <span>
            © {new Date().getFullYear()} SheetSync. All rights reserved.
          </span>
          <span className="flex items-center gap-1">
            Made with{" "}
            <Heart className="h-3 w-3 text-rose-400 fill-rose-400" /> by{" "}
            <span className="font-medium text-gray-500">Hassan Rehan</span>
          </span>
          <div className="flex gap-5">
            {["Privacy", "Terms"].map((l) => (
              <a
                key={l}
                href="#"
                className="hover:text-gray-600 transition-colors"
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