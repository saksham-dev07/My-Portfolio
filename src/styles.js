/*
  Centralized Spacing & Typography Design Tokens
*/

// Spacing tokens optimized for mobile and desktop
const spacing = {
  paddingX: "px-4 xs:px-6 sm:px-16",
  paddingY: "py-8 xs:py-12 sm:py-16",
  padding: "px-4 py-8 xs:px-6 xs:py-12 sm:px-16 sm:py-16",
};

// High-contrast responsive typography utilities
const typography = {
  heroHeadText: "font-black text-white mt-2 text-[32px] xs:text-[44px] sm:text-[60px] lg:text-[72px] leading-[1.15]",
  heroSubText: "font-medium text-zinc-400 text-[14px] xs:text-[16px] sm:text-[18px] lg:text-[20px] leading-relaxed",
  sectionHeadText: "text-4xl sm:text-5xl font-bold text-zinc-100",
  sectionSubText: "text-zinc-400 mb-2 text-xs sm:text-sm uppercase tracking-wider font-semibold",
};

export const styles = {
  ...spacing,
  ...typography,
};
