import type { Placeholderable } from "./types";
export interface Workshop extends Placeholderable { slug: string; title: string; eyebrow: string; description: string; tags: string[]; image?: string }
export const workshops: Workshop[] = [];
