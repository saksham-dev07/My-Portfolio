import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  memo 
} from "react";
import { motion as Motion, AnimatePresence, useReducedMotion, useScroll } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";

import { styles } from "../styles";
import { navLinks } from "../constants";
import { logo } from "../assets";

const NAVBAR_HEIGHT = 80;
const sectionIds = navLinks.map(link => link.id);

// High-performance IntersectionObserver for active section tracking (zero layout thrashing)
const useActiveSection = () => {
  const [active, setActive] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0.1,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return active;
};

// Header-offset aware smooth scroll with Lenis acceleration
const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.lenis) {
    window.lenis.scrollTo(el, { offset: -NAVBAR_HEIGHT, duration: 1.2 });
  } else {
    const yOffset = -NAVBAR_HEIGHT;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
};

// Desktop Nav Item
const DesktopNavItem = memo(({ item, active }) => {
  const { id, title } = item;
  const isActive = active === id;

  const handle = useCallback((e) => {
    e.preventDefault();
    scrollToSection(id);
  }, [id]);

  return (
    <button
      onClick={handle}
      className={`relative px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 outline-none ${
        isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
      }`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`Go to ${title}`}
    >
      {isActive && (
        <Motion.div
          layoutId="desktop-active-pill"
          className="absolute inset-0 bg-white/10 rounded-full border border-white/15 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
          transition={{ type: "tween", duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
      <span className="relative z-10">{title}</span>
    </button>
  );
});
DesktopNavItem.displayName = 'DesktopNavItem';

// Mobile Nav Item
const MobileNavItem = memo(({ item, onClick, active }) => {
  const { id, title, icon: Icon, isCta } = item;
  const reduce = useReducedMotion();
  const isActive = active === id;

  const handle = useCallback((e) => {
    e.preventDefault();
    onClick?.();
    setTimeout(() => {
      scrollToSection(id);
    }, 80);
  }, [id, onClick]);

  const base = `relative flex items-center font-medium transition-colors duration-200 outline-none w-full justify-start gap-3 px-4 py-3 rounded-xl text-left text-sm`;
  const cta = `${base} bg-accent text-white shadow-glass hover:bg-accentLight`;
  const reg = `${base} ${isActive ? 'text-accent bg-accent/10 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`;

  return (
    <Motion.button
      onClick={handle}
      className={isCta ? cta : reg}
      whileTap={reduce ? {} : { scale: 0.96 }}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`Go to ${title}`}
    >
      <Icon className="text-base" />
      <span>{title}</span>
      {isActive && !isCta && (
        <span className="right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-accent rounded-full absolute shadow-glassGlow" />
      )}
    </Motion.button>
  );
});
MobileNavItem.displayName = 'MobileNavItem';

const Logo = memo(() => {
  const handle = useCallback(() => {
    if (window.lenis) {
      window.lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <button
      onClick={handle}
      className="flex items-center gap-3 group focus:outline-none rounded-xl p-1.5 -m-1.5 cursor-pointer"
      aria-label="Go to top"
    >
      <div className="relative">
        <img 
          src={logo} 
          alt="Logo" 
          className="w-9 h-9 object-contain transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3" 
        />
        <div className="absolute inset-0 bg-accentGlow rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md" />
      </div>
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors">
            Saksham
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Available for opportunities" />
        </div>
        <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-400 tracking-tight">
          Software Engineer
        </span>
      </div>
    </button>
  );
});
Logo.displayName = 'Logo';

// Navbar
const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection();
  const reduce = useReducedMotion();
  const menuRef = useRef(null);

  // Minimal scroll state update (only triggers state when crossing 50px boundary)
  useEffect(() => {
    let prevScrolled = window.scrollY > 50;
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== prevScrolled) {
        prevScrolled = isScrolled;
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggle = useCallback(() => setOpen(v => !v), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onClick = e => {
      if (open && menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('[aria-controls="mobile-menu"]')) {
        close();
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open, close]);

  const { scrollYProgress } = useScroll();

  const standardNavLinks = navLinks.filter(item => !item.isCta);
  const ctaLink = navLinks.find(item => item.isCta);

  const handleCtaClick = useCallback((e) => {
    e.preventDefault();
    if (ctaLink) {
      scrollToSection(ctaLink.id);
    }
  }, [ctaLink]);

  return (
    <>
      <header 
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled 
            ? 'bg-zinc-950/85 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] py-3' 
            : 'bg-transparent py-5'
        }`} 
        role="banner"
      >
        {/* Top Scroll Reading Progress Indicator */}
        <Motion.div
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 origin-left z-50"
          style={{ scaleX: scrollYProgress }}
        />

        <div className={`${styles.paddingX} max-w-7xl mx-auto flex items-center justify-between`}>
          {/* Left: Brand Identity */}
          <Logo />

          {/* Center: Liquid Glass Floating Pill Navigation (Desktop) */}
          <nav 
            className="hidden lg:flex items-center p-1.5 rounded-full liquid-glass-island" 
            role="navigation" 
            aria-label="Desktop nav"
          >
            {standardNavLinks.map(item => (
              <DesktopNavItem key={item.id} item={item} active={active} />
            ))}
          </nav>

          {/* Right: Contact CTA Button (Desktop) */}
          {ctaLink && (
            <div className="hidden lg:flex items-center">
              <button
                onClick={handleCtaClick}
                className="group relative inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_25px_rgba(59,130,246,0.55)] transition-all duration-300 active:scale-95 cursor-pointer"
                aria-label="Contact Saksham"
              >
                <span>{ctaLink.title}</span>
                <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <Motion.button 
            onClick={toggle} 
            className="lg:hidden p-2 rounded-xl bg-zinc-900/80 border border-white/10 focus:outline-none text-white active:scale-95 transition-all" 
            whileTap={reduce ? {} : { scale: 0.9 }} 
            aria-label={open ? 'Close menu' : 'Open menu'} 
            aria-expanded={open} 
            aria-controls="mobile-menu"
          >
            <AnimatePresence mode="wait">
              <Motion.div 
                key={open ? 'close' : 'menu'} 
                initial={{ rotate: -90, opacity: 0 }} 
                animate={{ rotate: 0, opacity: 1 }} 
                exit={{ rotate: 90, opacity: 0 }} 
                transition={{ duration: 0.15 }}
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </Motion.div>
            </AnimatePresence>
          </Motion.button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {open && (
          <>  
            <Motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.2 }}
              onClick={close} 
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-40" 
            />
            <Motion.nav 
              id="mobile-menu" 
              ref={menuRef}
              initial={{ opacity: 0, x: 20, scale: 0.95 }} 
              animate={{ opacity: 1, x: 0, scale: 1 }} 
              exit={{ opacity: 0, x: 20, scale: 0.95 }} 
              transition={{ duration: 0.2 }}
              className="fixed top-20 right-4 w-72 bg-zinc-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-4 space-y-2 z-50" 
              role="navigation"
            >
              {navLinks.map((item) => (
                <MobileNavItem key={item.id} item={item} active={active} onClick={close} />
              ))}
              <div className="mt-4 pt-4 border-t border-white/10 text-center text-xs text-zinc-400">
                Saksham Agarwal &bull; Portfolio
              </div>
            </Motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(Navbar);
