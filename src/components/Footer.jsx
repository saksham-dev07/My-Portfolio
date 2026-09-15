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
    <footer className="relative bg-zinc-950/90 backdrop-blur-xl border-t border-white/10 text-zinc-400 py-12 px-6 overflow-hidden">
      {/* Top iridescent refraction line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 via-blue-500/50 to-transparent shadow-[0_0_12px_rgba(6,182,212,0.4)]" />

      {/* Ambient optical backlight flare */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Left branding */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
          <span className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Saksham <span className="accent-gradient-text italic font-serif">Agarwal</span>
          </span>
          <p className="text-xs text-zinc-400 font-mono">
            B.Tech CSE Student @ VIT Bhopal
          </p>
        </div>

        {/* Quick Nav Links */}
        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-zinc-400" aria-label="Footer navigation">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => handleNavClick(e, link.id)}
              className="hover:text-cyan-400 transition-colors duration-200 cursor-pointer"
            >
              {link.title}
            </a>
          ))}
        </nav>

        {/* Social Icons & Back to Top */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Motion.a
              href="https://github.com/saksham-dev07"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-full liquid-glass-island text-zinc-400 hover:text-white hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 cursor-pointer"
            >
              <Github size={15} />
            </Motion.a>
            <Motion.a
              href="https://www.linkedin.com/in/saksham-agarwal-b44910289/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-full liquid-glass-island text-zinc-400 hover:text-white hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 cursor-pointer"
              aria-label="LinkedIn Profile"
            >
              <Linkedin size={15} />
            </Motion.a>
            <Motion.a
              href="mailto:sakmmm07@gmail.com"
              aria-label="Email Contact"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-full liquid-glass-island text-zinc-400 hover:text-white hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 cursor-pointer"
            >
              <Mail size={15} />
            </Motion.a>
          </div>

          {/* Smooth Scroll Back To Top */}
          <Motion.button
            onClick={scrollToTop}
            aria-label="Back to top"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 px-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 border border-white/20 text-white shadow-[0_0_18px_rgba(59,130,246,0.35)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all duration-300 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowUp size={14} />
            <span>Top</span>
          </Motion.button>
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
