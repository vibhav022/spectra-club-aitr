import type { Placeholderable } from "./types";
export interface Testimonial extends Placeholderable { quote: string; name: string; role: string }
export const testimonials: Testimonial[] = [];
