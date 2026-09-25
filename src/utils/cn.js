import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Universal utility for conditionally joining and merging Tailwind CSS classes
 * without style conflicts or cascade order bugs.
 *
 * @param {...(string | number | boolean | undefined | null | object | array)} inputs
 * @returns {string} The resolved, deduplicated class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
