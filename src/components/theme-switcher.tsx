
'use client';

import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

export const themes = [
    {
        name: 'Poppy',
        id: 'theme-default',
        colors: ['#FF420E', '#80BD9E', '#F98866']
    },
    {
        name: 'Light',
        id: 'theme-light',
        colors: ['#3b82f6', '#f1f5f9', '#1e293b']
    },
    {
        name: 'Forest',
        id: 'theme-forest',
        colors: ['#0F1B07', '#5C821A', '#C6D166']
    },
    {
        name: 'Candy',
        id: 'theme-candy',
        colors: ['#ec4899', '#fff1f2', '#831843']
    },
    {
        name: 'Ocean',
        id: 'theme-ocean',
        colors: ['#0ea5e9', '#f0f9ff', '#0c4a6e']
    },
    {
        name: 'Peacock',
        id: 'theme-peacock',
        colors: ['#F62A00', '#1E656D', '#00293C'],
    },
    {
        name: 'Aurora',
        id: 'theme-aurora',
        colors: ['#a855f7', '#4c1d95', '#f5f3ff'],
    },
    {
        name: 'Sakura',
        id: 'theme-sakura',
        colors: ['#f472b6', '#fff1f7', '#500724'],
    },
    {
        name: 'Pro',
        id: 'theme-pro',
        colors: ['#111827', '#f3f4f6', '#9ca3af']
    },
    {
        name: 'Mint',
        id: 'theme-mint',
        colors: ['#10b981', '#f0fdfa', '#047857']
    },
    {
        name: 'Dramatic',
        id: 'theme-dramatic',
        colors: ['#AEBD38', '#68829E', '#505160']
    },
    {
        name: 'Tulip',
        id: 'theme-tulip',
        colors: ['#F18D9E', '#5BC8AC', '#E6D72A']
    },
    {
        name: 'Hibiscus',
        id: 'theme-hibiscus',
        colors: ['#F52549', '#9BC01C', '#FFD64D']
    },
    {
        name: 'Alpine',
        id: 'theme-alpine',
        colors: ['#34675C', '#4CB5F5', '#B3C100']
    },
    {
        name: 'Harvest',
        id: 'theme-harvest',
        colors: ['#258039', '#F5BE41', '#31A9B8']
    },
    {
        name: 'Pastel',
        id: 'theme-pastel',
        colors: ['#FFCCAC', '#C1E1DC', '#FFEB94']
    },
    {
        name: 'Tropical',
        id: 'theme-tropical',
        colors: ['#4897D8', '#FFDB5C', '#FA6E59']
    },
    {
        name: 'Lavanda',
        id: 'theme-lavanda',
        colors: ['#E6E6FA', '#800080', '#98FF98']
    },
    {
        name: 'Zosterops',
        id: 'theme-zosterops',
        colors: ['#EC96A4', '#5D535E', '#DFE166']
    },
    {
        name: 'Limonada',
        id: 'theme-limonada',
        colors: ['#F70025', '#F25C00', '#F9A603']
    },
    {
        name: 'Obsidian Gold',
        id: 'theme-obsidian-gold',
        colors: ['#1A1A1A', '#C0C0C0', '#FFD700'],
        previewBackground: 'linear-gradient(135deg, #0f0f0f 0%, #232323 38%, #c0c0c0 52%, #ffd700 74%, #a67c00 100%)'
    },
    {
        name: 'Obsidian Gold HC',
        id: 'theme-obsidian-gold-hc',
        colors: ['#000000', '#E5E5E5', '#FFD700'],
        previewBackground: 'linear-gradient(135deg, #000000 0%, #101010 30%, #f0f0f0 52%, #ffd700 72%, #b8860b 100%)'
    },
    {
        name: 'Obsidian Champagne',
        id: 'theme-obsidian-champagne',
        colors: ['#1A1A1A', '#C0C0C0', '#FFFDD0'],
        previewBackground: 'linear-gradient(135deg, #111111 0%, #1f1f1f 36%, #c1c1c1 52%, #fffdd0 76%, #d6c28a 100%)'
    },
    {
        name: 'Rose Gold Soft',
        id: 'theme-rose-gold-soft',
        colors: ['#B76E79', '#EAC102', '#F5E1DA'],
        previewBackground: 'linear-gradient(135deg, #f5e1da 0%, #fdf5e6 35%, #b76e79 58%, #eac102 82%, #f5e1da 100%)'
    },
    {
        name: 'Metal Armor',
        id: 'theme-metal-armor',
        colors: ['#848482', '#D3AE36', '#A67B00'],
        previewBackground: 'linear-gradient(135deg, #848482 0%, #c1c1c1 38%, #d3ae36 66%, #a67b00 100%)'
    },
    {
        name: 'Mercury Signals',
        id: 'theme-mercury-signals',
        colors: ['#1A1A1A', '#E5BE01', '#A6A6A6'],
        previewBackground: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 35%, #a6a6a6 58%, #e5be01 82%, #f2f2f2 100%)'
    }
];

interface ThemeSwitcherProps {
    selectedTheme: string;
    onThemeChange: (themeId: string) => void;
}

export function ThemeSwitcher({ selectedTheme, onThemeChange }: ThemeSwitcherProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {themes.map((theme) => (
                <div key={theme.id} onClick={() => onThemeChange(theme.id)} className="cursor-pointer">
                    <div
                        className={cn(
                            'rounded-lg border-2 p-2 transition-all',
                            selectedTheme === theme.id ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
                        )}
                    >
                        <div
                            className="h-16 w-full rounded-md flex items-center justify-center"
                            style={{ background: theme.previewBackground || theme.colors[0] }}
                        >
                            <div className="flex -space-x-2">
                                {theme.colors.map((color, index) => (
                                    <div
                                        key={index}
                                        className="h-6 w-6 rounded-full border-2 border-white/50"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                     <div className="mt-2 flex items-center justify-center gap-2">
                        {selectedTheme === theme.id && <CheckCircle className="h-4 w-4 text-primary" />}
                        <span className="text-sm font-medium">{theme.name}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
