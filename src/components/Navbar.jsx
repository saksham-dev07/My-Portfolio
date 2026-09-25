import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  memo 
} from "react";
import { motion as Motion, AnimatePresence, useReducedMotion, useScroll } from "framer-motion";
import { Menu, X, ArrowUpRight, Layers, Cpu, Server, Globe } from "lucide-react";

import { navLinks } from "../constants";
import { useRole } from "../context/RoleContext";
import { useArcade } from "../context/ArcadeContext";
import { useSound } from "../context/SoundContext";
import MoodSwitcher from "./interactive/MoodSwitcher";
import SoundToggle from "./interactive/SoundToggle";

const NAVBAR_HEIGHT = 80;
const sectionIds = [...navLinks.map(link => link.id), "smaller-builds"];

// High-performance IntersectionObserver for active section tracking
const useActiveSection = () => {
  const [active, setActive] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActive(id === "smaller-builds" ? "projects" : id);
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

const ROLES = [
  { id: "all", label: "All", icon: Layers },
  { id: "fullstack", label: "Full-Stack", icon: Globe },
  { id: "ai", label: "AI / ML", icon: Cpu },
  { id: "backend", label: "Backend", icon: Server },
];

// Role Switcher Component (inspired by abhyudaytomar.com's switcher)
const RoleSwitcher = memo(({ isMobile = false, onCloseMobile }) => {
  const { activeRole, setActiveRole } = useRole();

  const handleSelect = (roleId) => {
    setActiveRole(roleId);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Filter discipline focus"
      className={
        isMobile
          ? "grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-zinc-900 border border-white/10"
          : "relative flex items-center p-1 rounded-full bg-zinc-900/90 border border-white/10 shadow-inner backdrop-blur-xl shrink-0"
      }
    >
      {ROLES.map((role) => {
        const isSelected = activeRole === role.id;
        const Icon = role.icon;
        return (
          <button
            key={role.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => handleSelect(role.id)}
            className={
              isMobile
                ? `relative flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 outline-none cursor-pointer ${
                    isSelected
                      ? "text-cyan-300 bg-cyan-500/15 border border-cyan-400/40 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                  }`
                : `relative z-10 flex items-center gap-1.5 px-2.5 xl:px-3 py-1 text-[11px] xl:text-xs font-semibold tracking-tight transition-colors duration-200 outline-none cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`
            }
          >
            {!isMobile && isSelected && (
              <Motion.div
                layoutId="desktop-role-indicator"
                className="role-indicator-pill absolute inset-0 rounded-full bg-gradient-to-r from-blue-600/35 via-cyan-500/25 to-blue-600/35 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] backdrop-blur-md"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon size={13} className={`shrink-0 ${isSelected ? "text-cyan-400" : "text-zinc-500"}`} />
            <span className="relative z-10 whitespace-nowrap">{role.label}</span>
          </button>
        );
      })}
    </div>
  );
});
RoleSwitcher.displayName = "RoleSwitcher";

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
      className={`relative px-2.5 xl:px-3.5 py-1 xl:py-1.5 rounded-full text-[11px] xl:text-xs font-semibold tracking-wide transition-all duration-200 outline-none cursor-pointer whitespace-nowrap shrink-0 ${
        isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-100'
      }`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`Go to ${title}`}
    >
      {isActive && (
        <Motion.div
          layoutId="desktop-active-pill"
          className="absolute inset-0 bg-white/[0.08] rounded-full border border-white/20 shadow-sm backdrop-blur-md"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <span className="relative z-10 whitespace-nowrap">{title}</span>
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

  const base = "relative flex items-center font-medium transition-all duration-200 outline-none w-full justify-start gap-3 px-4 py-3 rounded-xl text-left text-sm cursor-pointer";
  const cta = `${base} mt-2 bg-white text-zinc-950 font-bold hover:bg-zinc-200 shadow-lg shadow-white/10 active:scale-[0.98]`;
  const reg = `${base} ${isActive ? 'text-cyan-400 bg-cyan-400/10 font-semibold border border-cyan-400/25' : 'text-zinc-300 hover:text-white hover:bg-white/5 border border-transparent'}`;

  return (
    <Motion.button
      onClick={handle}
      className={isCta ? cta : reg}
      whileTap={reduce ? {} : { scale: 0.98 }}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`Go to ${title}`}
    >
      <Icon className={`text-base shrink-0 ${isCta ? 'text-zinc-950' : isActive ? 'text-cyan-400' : 'text-zinc-400'}`} />
      <span className="flex-1">{title}</span>
      {isActive && !isCta && (
        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)] shrink-0" />
      )}
      {isCta && (
        <ArrowUpRight size={15} className="text-zinc-950 shrink-0" />
      )}
    </Motion.button>
  );
});
MobileNavItem.displayName = 'MobileNavItem';

const Logo = memo(() => {
  const { openSignalRun } = useArcade();
  const { playBlip, playVictory } = useSound();
  const [clickCount, setClickCount] = useState(0);
  const resetTimerRef = useRef(null);

  const handle = useCallback(() => {
    // Standard smooth scroll to top
    if (window.lenis) {
      window.lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Rapid easter egg click tracker
    setClickCount((prev) => {
      const next = prev + 1;
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

      if (next >= 5) {
        playVictory();
        openSignalRun();
        return 0;
      } else {
        playBlip();
        resetTimerRef.current = setTimeout(() => {
          setClickCount(0);
        }, 2200);
        return next;
      }
    });
  }, [openSignalRun, playBlip, playVictory]);

  return (
    <button
      onClick={handle}
      className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none rounded-xl p-1 -m-1 cursor-pointer shrink-0"
      aria-label="Saksham Agarwal - Back to top"
    >
      {/* Monogram Brand Mark (inspired by abhyudaytomar.com's 'AT' mark) */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-white/15 text-white font-mono text-xs font-bold tracking-tight shadow-md group-hover:border-cyan-400/50 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.35)] transition-all shrink-0">
        <span>SA</span>

        {/* Combo click counter indicator */}
        {clickCount > 0 && (
          <span className="absolute -top-2.5 -right-2 px-1.5 py-0.2 rounded-full bg-cyan-500 text-zinc-950 text-[9px] font-bold shadow-md animate-bounce">
            {clickCount}/5
          </span>
        )}
      </div>
      <div className="hidden sm:flex flex-col text-left">
        <span className="text-sm font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors whitespace-nowrap">
          Saksham Agarwal
        </span>
        <span className="hidden xl:inline-block text-[10px] font-mono text-zinc-500 tracking-wider">
          B.Tech CSE &bull; 2027
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
    let prevScrolled = window.scrollY > 40;
    const handleScroll = () => {
      const isScrolled = window.scrollY > 40;
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
    // Explicitly stop Lenis so it doesn't fight with overflow:hidden
    if (window.lenis) window.lenis.stop();
    return () => {
      document.body.style.overflow = '';
      // Always force-restart Lenis on cleanup to prevent stuck scroll
      if (window.lenis) window.lenis.start();
    };
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
            ? 'bg-zinc-950/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.7)] py-2.5' 
            : 'bg-transparent py-4 sm:py-5'
        }`} 
        role="banner"
      >
        {/* Top Scroll Reading Progress Indicator */}
        <Motion.div
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] origin-left z-50"
          style={{ scaleX: scrollYProgress }}
        />

        <div className="px-3 sm:px-6 xl:px-8 max-w-[1440px] mx-auto flex items-center justify-between gap-2 xl:gap-3">
          {/* Left: Brand Identity */}
          <div className="shrink-0">
            <Logo />
          </div>

          {/* Center: Discipline / Role Switcher (abhyudaytomar.com inspiration) */}
          <div className="hidden md:flex items-center shrink-0">
            <RoleSwitcher />
          </div>

          {/* Right: Section Links + Controls + CTA */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-2.5 shrink-0">
            <nav 
              className="flex items-center p-1 rounded-full bg-zinc-900/60 border border-white/10 shadow-sm backdrop-blur-md shrink-0" 
              role="navigation" 
              aria-label="Desktop nav"
            >
              {standardNavLinks.map(item => (
                <DesktopNavItem key={item.id} item={item} active={active} />
              ))}
            </nav>

            {/* Subtle vertical separator */}
            <div className="w-px h-5 bg-white/10 shrink-0" />

            {/* Theme + SFX control cluster */}
            <div className="flex items-center gap-1.5 shrink-0">
              <MoodSwitcher isMobile={false} />
              <SoundToggle isMobile={false} />
            </div>

            {ctaLink && (
              <Motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleCtaClick}
                className="group relative inline-flex items-center gap-1.5 px-3.5 xl:px-4 py-1.5 rounded-full text-[11px] xl:text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-200 border border-white/20 shadow-md shadow-white/10 transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0"
                aria-label="Contact Saksham"
              >
                <span>{ctaLink.title}</span>
                <ArrowUpRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
              </Motion.button>
            )}
          </div>

          {/* Mobile Controls — Perfectly sized to prevent overflow on any screen */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
            <MoodSwitcher isMobile={true} />
            <SoundToggle isMobile={true} />
            <Motion.button 
              onClick={toggle} 
              className="p-1.5 sm:p-2 rounded-xl bg-zinc-900 border border-white/15 text-white active:scale-95 transition-all shadow-sm shrink-0" 
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
                  {open ? <X size={18} /> : <Menu size={18} />}
                </Motion.div>
              </AnimatePresence>
            </Motion.button>
          </div>
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
              className="fixed inset-0 bg-black/85 backdrop-blur-xl z-40" 
            />
            <Motion.nav 
              id="mobile-menu" 
              ref={menuRef}
              initial={{ opacity: 0, y: -10, scale: 0.96 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -10, scale: 0.96 }} 
              transition={{ duration: 0.2 }}
              className="fixed top-18 sm:top-20 right-3 left-3 sm:right-6 sm:left-auto sm:w-88 bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-5 space-y-4 z-50 overflow-hidden max-h-[85vh] overflow-y-auto" 
              role="navigation"
            >
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-cyan-400/40 flex items-center justify-center font-mono text-[10px] font-bold text-cyan-400">
                    SA
                  </div>
                  <span className="font-bold text-sm text-white">Directory Menu</span>
                </div>
                <button
                  onClick={close}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Focus Discipline Switcher in Mobile Drawer */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  Focus Discipline
                </p>
                <RoleSwitcher isMobile onCloseMobile={close} />
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 pt-1">
                {navLinks.map((item) => (
                  <MobileNavItem key={item.id} item={item} active={active} onClick={close} />
                ))}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>Saksham Agarwal</span>
                <span>VIT Bhopal &bull; 2027</span>
              </div>
            </Motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(Navbar);
