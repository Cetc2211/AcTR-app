import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PartialId } from "./placeholder-data";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPartialLabel(partialId: PartialId): string {
    switch (partialId) {
        case 'p1': return 'Primer Parcial';
        case 'p2': return 'Segundo Parcial';
        case 'p3': return 'Tercer Parcial';
        default: return '';
    }
}
