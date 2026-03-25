import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPartialLabel(partialId: string): string {
  const labels: Record<string, string> = {
    'p1': 'Primer Parcial',
    'p2': 'Segundo Parcial',
    'p3': 'Tercer Parcial',
    'p4': 'Cuarto Parcial',
  };
  return labels[partialId] || partialId;
}
