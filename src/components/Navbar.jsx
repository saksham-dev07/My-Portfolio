import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo,
  memo 
} from "react";
import { motion as Motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NavLink as RouterLink } from "react-router-dom";

import { styles } from "../styles";
import { navLinks } from "../constants";
import { logo } from "../assets";

// Constants
const SCROLL_THRESHOLD = 60;
const HIDE_THRESHOLD = 100;
const NAVBAR_HEIGHT = 64; // px
const sectionIds = navLinks.map(link => link.id);

// Hooks
const useScrollDirection = () => {
  const [state, setState] = useState({ scrolled: false, hidden: false, atTop: true });
  const prevY = useRef(0);
  const ticking = useRef(false);

  const update = useCallback(() => {
    const y = window.scrollY;
    setState({
      scrolled: y > SCROLL_THRESHOLD,
      hidden: y > prevY.current && y > HIDE_THRESHOLD,
      atTop: y < 10
    });
    prevY.current = y;
    ticking.current = false;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(update);
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [update]);

  return state;
};

const useActiveSection = () => {
  const [active, setActive] = useState('');
  useEffect(() => {
    const cb = () => {
      sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= NAVBAR_HEIGHT + 5 && rect.bottom > NAVBAR_HEIGHT + 5) {
          setActive(id);
        }
      });
    };
    window.addEventListener('scroll', cb, { passive: true });
    cb();
    return () => window.removeEventListener('scroll', cb);
  }, []);
  return active;
};

const useKeyboardNavigation = (open, setOpen) => {
  const focusRef = useRef([]);
  const idx = useRef(0);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return setOpen(false);
      if (!open) return;
      const els = focusRef.current;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          idx.current = (idx.current + 1) % els.length;
          els[idx.current]?.focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          idx.current = idx.current === 0 ? els.length - 1 : idx.current - 1;
          els[idx.current]?.focus();
          break;
        case 'Home':
          e.preventDefault(); idx.current = 0; els[0]?.focus(); break;
        case 'End':
          e.preventDefault(); idx.current = els.length - 1; els[idx.current]?.focus(); break;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);
  return focusRef;
};

// Smooth scroll
const scrollToSection = id => {
  const el = document.getElementById(id);
  if (!el) return console.warn(`No section: ${id}`);
  el.scrollIntoView({ behavior: 'smooth' });
};

// NavItem
const NavItem = memo(({ item, isMobile = false, onClick, active }) => {
  const { id, title, icon: Icon, isCta } = item;
  const reduce = useReducedMotion();
  const isActive = active === id;

  const handle = useCallback(e => {
    e.preventDefault();
    scrollToSection(id);
    onClick?.();
  }, [id, onClick]);

  const base = `relative flex items-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent ${isMobile ? 'w-full justify-start gap-3 px-4 py-3 rounded-lg text-left' : 'px-3 py-2 rounded-md'}`;
  const cta = `${base} bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white shadow-lg hover:scale-105 active:scale-95`;
  const reg = `${base} ${isActive ? 'text-purple-400 bg-purple-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`;
  const cls = isCta ? cta : reg;

  return (
    <Motion.button
      onClick={handle}
      className={cls}
      whileTap={reduce ? {} : { scale: 0.95 }}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`Go to ${title}`}
    >
      <Icon className={`${isMobile ? 'text-lg' : 'text-base'} ${!isCta && 'mr-2'}`} />
      <span>{title}</span>
      {isActive && !isCta && (
        <Motion.div
          layoutId={isMobile ? 'activeMobile' : 'active'}
          className={`${isMobile ? 'right-4 top-1/2 -translate-y-1/2 w-2 h-2' : '-bottom-1 left-1/2 -translate-x-1/2 w-1 h-1'} bg-purple-400 rounded-full absolute`}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </Motion.button>
  );
});
NavItem.displayName = 'NavItem';

const Logo = memo(() => {
  const handle = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);
  return (
    <Motion.button
      onClick={handle}
      className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-lg p-2 -m-2"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label="Go to top"
    >
      <div className="relative">
        <img src={logo} alt="Logo" className="w-10 h-10 object-contain transition-transform duration-200 group-hover:rotate-6" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
        <span className="text-lg font-bold text-white">Saksham</span>
        <span className="hidden sm:inline-block text-sm text-gray-400">Web Developer</span>
      </div>
    </Motion.button>
  );
});
Logo.displayName = 'Logo';

// Navbar
const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { scrolled, hidden, atTop: _atTop } = useScrollDirection();
  const active = useActiveSection();
  const reduce = useReducedMotion();
  const focusRef = useKeyboardNavigation(open, setOpen);

  const toggle = useCallback(() => setOpen(v => !v), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const width = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${width}px`;
    return () => { document.body.style.overflow=''; document.body.style.paddingRight=''; };
  }, [open]);

  useEffect(() => {
    const onClick = e => {
      if (open && !e.target.closest('#mobile-menu') && !e.target.closest('[aria-controls="mobile-menu"]')) close();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open, close]);

  const variants = useMemo(() => ({ visible:{ y:0, transition:{ type:'spring', stiffness:400, damping:40 } }, hidden:{ y:'-100%', transition:{ type:'spring', stiffness:400, damping:40 } }}), []);
  const backdrop = useMemo(() => ({ visible:{ opacity:1 }, hidden:{ opacity:0 } }), []);
  const menuVar = useMemo(() => ({ visible:{ opacity:1, x:0, scale:1, transition:{ type:'spring', stiffness:300, damping:30, staggerChildren:0.05 } }, hidden:{ opacity:0, x:20, scale:0.95, transition:{ type:'spring', stiffness:400, damping:40 } } }), []);
  const itemVar = useMemo(() => ({ visible:{ opacity:1, x:0 }, hidden:{ opacity:0, x:20 } }), []);

  return (
    <>
      <Motion.header variants={variants} initial={false} animate={hidden ? 'hidden' : 'visible'} className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled? 'bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg':'bg-transparent'}`} role="banner">
        <div className={`${styles.paddingX} max-w-7xl mx-auto flex items-center justify-between h-16`}>
          <Logo />
          <nav className="hidden lg:flex items-center space-x-1" role="navigation" aria-label="Desktop nav">
            {navLinks.map(item => sectionIds.includes(item.id)
              ? <NavItem key={item.id} item={item} active={active} />
              : <RouterLink key={item.id} to={item.id} className={({isActive}) => `px-3 py-2 rounded-md font-medium ${isActive? 'text-purple-600':'text-gray-300 hover:text-white'}`}> <item.icon className="mr-2 text-base"/> {item.title} </RouterLink>
            )}
          </nav>
          <Motion.button onClick={toggle} className="lg:hidden p-2 focus:outline-none text-white" whileTap={reduce? {}:{scale:0.9}} aria-label={open? 'Close menu':'Open menu'} aria-expanded={open} aria-controls="mobile-menu">
            <AnimatePresence mode="wait">
              <Motion.div key={open?'close':'menu'} initial={{rotate:-90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:90,opacity:0}} transition={{duration:0.2}}>
                {open? <X size={24}/> : <Menu size={24}/>}
              </Motion.div>
            </AnimatePresence>
          </Motion.button>
        </div>
      </Motion.header>

      <AnimatePresence>
        {open && (
          <>  
            <Motion.div variants={backdrop} initial="hidden" animate="visible" exit="hidden" onClick={close} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <Motion.nav id="mobile-menu" variants={menuVar} initial="hidden" animate="visible" exit="hidden" className="fixed top-16 right-4 w-72 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-4 space-y-2 z-50" ref={el => el && (focusRef.current = Array.from(el.querySelectorAll('button, a')))} role="navigation">
              {navLinks.map((item, i) => (
                <Motion.div key={item.id} variants={itemVar} custom={i}>
                  {sectionIds.includes(item.id)
                    ? <NavItem item={item} isMobile active={active} onClick={close} />
                    : <RouterLink to={item.id} onClick={close} className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-200 hover:text-white"> <item.icon/> <span>{item.title}</span> </RouterLink>
                  }
                </Motion.div>
              ))}
              <div className="mt-4 pt-4 border-t border-white/10 text-center text-xs text-gray-400">© 2024 Saksham • Web Developer</div>
            </Motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(Navbar);
