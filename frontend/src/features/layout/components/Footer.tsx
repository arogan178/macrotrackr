import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => (
  <footer className="relative z-10 border-t border-slate-800/50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-4 pb-2">
            MacroTrackr
          </h3>
          <p className="text-slate-400 text-lg max-w-md">
            The most intuitive macro tracking app for achieving your fitness
            and nutrition goals.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800/50">
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8 text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} MacroTrackr. All rights
            reserved.
          </p>
          <div className="flex items-center space-x-4">
            <Link
              to="/terms"
              className="hover:text-white transition-colors text-sm"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="hover:text-white transition-colors text-sm"
            >
              Privacy
            </Link>
            <a
              href="mailto:contact@macrotrackr.com"
              className="hover:text-white transition-colors text-sm"
            >
              Contact
            </a>
            <a
              href="mailto:support@macrotrackr.com"
              className="hover:text-white transition-colors text-sm"
            >
              Support
            </a>
          </div>
        </div>

        <div className="mt-4 md:mt-0">
          <p className="text-slate-400 text-sm">
            Track better. Live healthier.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
