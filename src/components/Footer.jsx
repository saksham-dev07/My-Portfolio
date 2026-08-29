import React, { memo, useCallback } from "react";
import { motion as Motion } from "framer-motion";
import { ArrowUp, Github, Linkedin, Mail, Heart } from "lucide-react";
import { navLinks } from "../constants";

const Footer = memo(() => {
  const scrollToTop = useCallback(() => {
    if (window.lenis) {
      window.lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleNavClick = useCallback((e, targetId) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      if (window.lenis) {
        window.lenis.scrollTo(el, { offset: -80, duration: 1.2 });
      } else {
        const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  }, []);

  return (
    <footer className="relative bg-zinc-950/90 backdrop-blur-md border-t border-white/10 text-zinc-400 py-12 px-6 overflow-hidden">
      {/* Top iridescent refraction line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left branding */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
          <span className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Saksham <span className="accent-gradient-text italic font-serif">Agarwal</span>
          </span>
          <p className="text-xs text-zinc-500 font-mono">
            Software Engineer • B.Tech CSE @ VIT Bhopal
          </p>
        </div>

        {/* Quick Nav Links */}
        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-zinc-400" aria-label="Footer navigation">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => handleNavClick(e, link.id)}
              className="hover:text-blue-400 transition-colors duration-200"
            >
              {link.title}
            </a>
          ))}
        </nav>

        {/* Social Icons & Back to Top */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/saksham-dev07"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
              className="p-2.5 rounded-full liquid-glass-island text-zinc-400 hover:text-white hover:border-accent transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <Github size={15} />
            </a>
            <a
              href="https://www.linkedin.com/in/saksham-agarwal-b44910289/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full liquid-glass-island text-zinc-400 hover:text-white hover:border-accent transition-all duration-300 active:scale-95 cursor-pointer"
              aria-label="LinkedIn Profile"
            >
              <Linkedin size={15} />
            </a>
            <a
              href="mailto:sakmmm07@gmail.com"
              aria-label="Email Contact"
              className="p-2.5 rounded-full liquid-glass-island text-zinc-400 hover:text-white hover:border-accent transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <Mail size={15} />
            </a>
          </div>

          {/* Smooth Scroll Back To Top */}
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="p-2.5 px-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 active:scale-95 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowUp size={14} />
            <span>Top</span>
          </button>
        </div>

      </div>

      {/* Bottom copyright line */}
      <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Saksham Agarwal. Built with React & Three.js. All rights reserved.
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
export default Footer;
