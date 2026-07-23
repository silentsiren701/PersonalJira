import { clsx, type ClassValue } from "clsx";

/** Tiny classname combinator (no tailwind-merge dependency needed at this scale). */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
