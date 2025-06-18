import React, {
  memo,
  useEffect,
  useState,
  useMemo,
  useRef,
  Suspense,
  lazy
} from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { styles } from '../styles';
import { services } from '../constants';
import { SectionWrapperr } from '../hoc';
import {
  fadeIn,
  textVariant,
  
  cardVariant,
  
  buttonTap,
  // New motion variants to add to motion.js
  skillTagVariant,
  glowEffect,
  floatingAnimation,
  staggerContainer,
  scaleOnHover,
  shimmerEffect
} from '../utils/motion';

const Tilt = lazy(() => import('react-parallax-tilt'));

const CARD_GRADIENTS = [
  'from-blue-500 via-purple-500 to-indigo-600',
  'from-pink-500 via-rose-500 to-red-500',
  'from-amber-500 via-orange-500 to-yellow-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-violet-500 via-purple-500 to-fuchsia-500',
];

const SKILL_CATEGORIES = {
  frontend: ['React', 'Three.js', 'TypeScript', 'Tailwind CSS', 'Next.js'],
  backend: ['Node.js', 'Express', 'Flask', 'Python', 'Java'],
  database: ['MongoDB', 'PostgreSQL', 'Redis', 'Prisma'],
  tools: ['Docker', 'Git', 'AWS', 'Vercel', 'GitHub Actions'],
};

function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '50px', ...options }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [options]);

  return [ref, isIntersecting];
}

const SkillTag = memo(({ skill, index, category }) => {
  const [ref, isInView] = useIntersectionObserver();
  const reduceMotion = useReducedMotion();

  const categoryColors = {
    frontend: 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-400/50',
    backend: 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30 hover:border-green-400/50',
    database: 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30 hover:border-purple-400/50',
    tools: 'bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30 hover:border-orange-400/50',
  };

  return (
    <Motion.li
      ref={ref}
      variants={reduceMotion ? {} : skillTagVariant(index)}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      whileHover={reduceMotion ? {} : scaleOnHover}
      whileTap={reduceMotion ? {} : buttonTap}
      className={clsx(
        'relative border rounded-full py-2 px-4 text-sm font-medium',
        'transition-all duration-300 ease-out cursor-pointer',
        'hover:shadow-lg hover:shadow-current/25',
        'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-white/20',
        'group overflow-hidden',
        categoryColors[category] || categoryColors.tools
      )}
      role="listitem"
      aria-label={`${skill} - ${category} skill`}
    >
      <span className="relative z-10 select-none">{skill}</span>
      <Motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        variants={reduceMotion ? {} : shimmerEffect}
        initial="hidden"
        whileHover="visible"
      />
    </Motion.li>
  );
});
SkillTag.displayName = 'SkillTag';

const ServiceCard = memo(({ service, index }) => {
  const { title, icon } = service;
  const [ref, isInView] = useIntersectionObserver();
  const reduceMotion = useReducedMotion();

  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  const tiltProps = useMemo(() => ({
    tiltEnable: !reduceMotion,
    glareEnable: !reduceMotion,
    glareMaxOpacity: 0.15,
    tiltMaxAngleX: 8,
    tiltMaxAngleY: 8,
    transitionSpeed: 400,
    scale: 1.01,
  }), [reduceMotion]);

  return (
    <Motion.div
      ref={ref}
      variants={reduceMotion ? {} : cardVariant(index)}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      className="group relative w-full max-w-sm mx-auto"
    >
      <Suspense fallback={
        <div className="w-full h-64 bg-gray-800/50 rounded-2xl animate-pulse border border-gray-700/50" />
      }>
        <Tilt {...tiltProps} className="w-full h-full">
          <Motion.div
            className={clsx(
              'relative bg-gradient-to-br p-[1px] rounded-2xl',
              'shadow-xl transition-all duration-500 ease-out',
              'group-hover:shadow-2xl group-hover:shadow-purple-500/20',
              gradient
            )}
            variants={reduceMotion ? {} : glowEffect}
            whileHover="hover"
            role="article"
            aria-labelledby={`service-${index}-title`}
          >
            <div className="relative bg-gray-900/95 backdrop-blur-sm rounded-2xl p-6 h-full overflow-hidden">
              {/* Floating background elements */}
              <Motion.div
                className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl"
                variants={reduceMotion ? {} : floatingAnimation}
                animate="animate"
              />
              <Motion.div
                className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-xl"
                variants={reduceMotion ? {} : floatingAnimation}
                animate="animate"
                style={{ animationDelay: '1s' }}
              />

              <div className="relative z-10">
                <Motion.div 
                  className="flex justify-center mb-6"
                  variants={reduceMotion ? {} : scaleOnHover}
                  whileHover="hover"
                >
                  <div className="relative p-4 bg-white/10 rounded-2xl backdrop-blur-sm transition-all duration-300 group-hover:bg-white/20">
                    <img 
                      src={icon} 
                      alt="" 
                      className="w-12 h-12 object-contain filter brightness-110 transition-transform duration-300 group-hover:scale-110" 
                      loading="lazy" 
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
                  </div>
                </Motion.div>

                <div className="text-center space-y-4">
                  <Motion.h3 
                    id={`service-${index}-title`}
                    className="text-white text-xl font-bold leading-tight"
                    variants={reduceMotion ? {} : fadeIn('up', 'spring', 0.3, 0.6)}
                    initial="hidden"
                    animate={isInView ? 'show' : 'hidden'}
                  >
                    {title}
                  </Motion.h3>
                  <Motion.p 
                    className="text-gray-300 text-sm leading-relaxed max-w-xs mx-auto transition-all duration-300 group-hover:text-gray-100"
                    variants={reduceMotion ? {} : fadeIn('up', 'spring', 0.5, 0.6)}
                    initial="hidden"
                    animate={isInView ? 'show' : 'hidden'}
                  >
                    Elevate your project with expert{' '}
                    <span className="font-semibold text-white bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      {title.toLowerCase()}
                    </span>{' '}
                    development and modern best practices.
                  </Motion.p>
                </div>
              </div>

              {/* Hover overlay with improved animation */}
              <Motion.div 
                className="absolute inset-0 bg-gradient-to-t from-white/5 via-white/2 to-transparent rounded-2xl pointer-events-none"
                variants={reduceMotion ? {} : {
                  hidden: { opacity: 0, scale: 0.8 },
                  hover: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } }
                }}
                initial="hidden"
                whileHover="hover"
              />
            </div>
          </Motion.div>
        </Tilt>
      </Suspense>
    </Motion.div>
  );
});
ServiceCard.displayName = 'ServiceCard';

const SkillsSection = memo(() => {
  const [ref, isInView] = useIntersectionObserver();
  const reduceMotion = useReducedMotion();

  return (
    <Motion.section
      ref={ref}
      variants={reduceMotion ? {} : fadeIn('up', 'spring', 0.3, 0.8)}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      className="relative bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700/30 overflow-hidden"
      aria-labelledby="skills-heading"
    >
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-3xl" />
      <Motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"
        variants={reduceMotion ? {} : floatingAnimation}
        animate="animate"
      />
      <Motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
        variants={reduceMotion ? {} : floatingAnimation}
        animate="animate"
        style={{ animationDelay: '2s' }}
      />

      <div className="relative z-10">
        <Motion.h3 
          id="skills-heading" 
          className="text-3xl font-bold text-white text-center mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent"
          variants={reduceMotion ? {} : textVariant(0.2)}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
        >
          Technical Expertise
        </Motion.h3>

        <Motion.p 
          className="text-gray-300 leading-relaxed max-w-3xl mx-auto text-center mb-12 text-lg"
          variants={reduceMotion ? {} : fadeIn('up', 'spring', 0.4, 0.8)}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
        >
          I'm a multidisciplinary full-stack developer passionate about crafting performant, 
          scalable applications with delightful user experiences. My expertise spans:
        </Motion.p>

        <Motion.div 
          className="space-y-8"
          variants={reduceMotion ? {} : staggerContainer(0.1, 0.2)}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
        >
          {Object.entries(SKILL_CATEGORIES).map(([category, skills], categoryIndex) => (
            <Motion.div 
              key={category} 
              className="space-y-4"
              variants={reduceMotion ? {} : fadeIn('up', 'spring', categoryIndex * 0.1, 0.6)}
            >
              <h4 className="text-xl font-semibold text-white capitalize mb-4 flex items-center gap-3">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></span>
                {category === 'frontend' ? 'Frontend Development' : 
                 category === 'backend' ? 'Backend Development' :
                 category === 'database' ? 'Database & Storage' : 'Tools & DevOps'}
              </h4>
              <Motion.ul 
                className="flex flex-wrap gap-3 justify-center sm:justify-start"
                role="list"
                aria-label={`${category} skills`}
                variants={reduceMotion ? {} : staggerContainer(0.05, 0.1)}
                initial="hidden"
                animate={isInView ? 'show' : 'hidden'}
              >
                {skills.map((skill, index) => (
                  <SkillTag 
                    key={skill} 
                    skill={skill} 
                    index={index}
                    category={category}
                  />
                ))}
              </Motion.ul>
            </Motion.div>
          ))}
        </Motion.div>
      </div>
    </Motion.section>
  );
});
SkillsSection.displayName = 'SkillsSection';

const About = memo(() => {
  const [headerRef, headerInView] = useIntersectionObserver();
  const reduceMotion = useReducedMotion();

  return (
    <section 
      id="about" 
      className="relative min-h-screen py-20 px-6 sm:px-16 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden"
      aria-labelledby="about-heading"
    >
      {/* Enhanced background with animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl"
          variants={reduceMotion ? {} : floatingAnimation}
          animate="animate"
        />
        <Motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl"
          variants={reduceMotion ? {} : floatingAnimation}
          animate="animate"
          style={{ animationDelay: '3s' }}
        />
        <Motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl"
          variants={reduceMotion ? {} : floatingAnimation}
          animate="animate"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl">
        <Motion.header
          ref={headerRef}
          variants={reduceMotion ? {} : textVariant()}
          initial="hidden"
          animate={headerInView ? 'show' : 'hidden'}
          className="text-center mb-20"
        >
          <Motion.p 
            className={clsx(styles.sectionSubText, 'text-gray-400 mb-4')}
            variants={reduceMotion ? {} : fadeIn('up', 'spring', 0.1, 0.6)}
          >
            Who I Am
          </Motion.p>
          <Motion.h1 
            id="about-heading" 
            className={clsx(
              styles.sectionHeadText, 
              'bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent',
              'drop-shadow-2xl'
            )}
            variants={reduceMotion ? {} : fadeIn('up', 'spring', 0.3, 0.8)}
          >
            About Me
          </Motion.h1>
        </Motion.header>

        <Motion.div 
          className="mb-20"
          variants={reduceMotion ? {} : fadeIn('up', 'spring', 0.5, 0.8)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <SkillsSection />
        </Motion.div>

        <Motion.div 
          variants={reduceMotion ? {} : staggerContainer(0.2, 0.3)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center"
          role="list"
          aria-label="Services offered"
        >
          {services.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} />
          ))}
        </Motion.div>
      </div>
    </section>
  );
});

About.displayName = 'About';
const WrappedAbout = SectionWrapperr(About, 'about');
WrappedAbout.displayName = 'WrappedAbout';
export default WrappedAbout;