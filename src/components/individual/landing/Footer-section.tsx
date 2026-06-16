"use client";

import { Table, Mail, Heart } from "lucide-react";
import Link from "next/link";

const FooterSection = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-12 pb-8 px-5 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-10 mb-8">

          {/* Brand + tagline */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Table className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-gray-900">SheetSync</span>
            </div>
            <p className="text-xs text-gray-400">Spreadsheets built for teams.</p>
            <p className="text-xs text-gray-400 mt-0.5">Inspired by Google Sheets.</p>
            <Link
              href="mailto:support@sheetsync.app"
              aria-label="Email"
              className="mt-3 h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
            >
              <Mail className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Product links */}
          <div>
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Product</p>
            <ul className="space-y-2">
              {["Features", "How it works", "What's included", "FAQ"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Legal</p>
            <ul className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Security"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Contact</p>
            <ul className="space-y-2">
              <li><a href="mailto:support@sheetsync.app" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">support@sheetsync.app</a></li>
              <li><span className="text-xs text-gray-400">Early access product</span></li>
              <li><span className="text-xs text-gray-400">Actively being built</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} SheetSync, Inc. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> by Hassan Rehan
          </span>
          <span>Early access — features are actively being built.</span>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;