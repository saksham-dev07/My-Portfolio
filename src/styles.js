/*
  Refactored Tailwind styles:
  • Centralized spacing tokens
  • Grouped typography into arrays for readability
  • Adopted theme-based color utility (text-secondary)
*/

// Spacing tokens
const spacing = {
  paddingX: "px-6 sm:px-16",
  paddingY: "py-10 sm:py-16",
  padding: "px-6 py-10 sm:px-16 sm:py-16",
};

// Responsive typography utilities
const typography = {
  heroHeadText: [
    "font-black text-white mt-2",
    "text-[40px] xs:text-[50px] sm:text-[60px] lg:text-[80px]",
    "lg:leading-[98px]",
  ].join(" "),

  heroSubText: [
    "font-medium text-secondary",
    "text-[16px] xs:text-[20px] sm:text-[26px] lg:text-[30px]",
    "lg:leading-[40px]",
  ].join(" "),

  sectionHeadText: [
    "font-black text-white",
    "text-[30px] xs:text-[40px] sm:text-[50px] md:text-[60px]",
  ].join(" "),

  sectionSubText: [
    "text-secondary uppercase tracking-wider",
    "text-[14px] sm:text-[18px]",
  ].join(" "),
};

export const styles = {
  ...spacing,
  ...typography,
};
