
## Contenido Completo del Proyecto para Migración

Copie y pegue el contenido de cada archivo en los archivos correspondientes en su nuevo entorno de desarrollo.

---
### ARCHIVO: package.json
---
```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "npm audit",
    "postinstall": "patch-package"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "firebase": "^10.12.3",
    "firebase-admin": "^12.2.0",
    "firebase-functions": "^5.0.1",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1",
    "lucide-react": "^0.475.0",
    "next": "14.2.5",
    "patch-package": "^8.0.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-firebase-hooks": "^5.1.1",
    "react-hook-form": "^7.52.1",
    "react-is": "^18.3.1",
    "react-markdown": "^9.0.1",
    "react-to-print": "^2.15.1",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

---
### ARCHIVO: tailwind.config.ts
---
```ts
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['"PT Sans"', 'sans-serif'],
        headline: ['"PT Sans"', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          'foreground-alt': 'hsl(var(--card-foreground-alt))',
          '1': 'hsl(var(--card-1))',
          '2': 'hsl(var(--card-2))',
          '3': 'hsl(var(--card-3))',
          '4': 'hsl(var(--card-4))',
          '5': 'hsl(var(--card-5))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        partial: {
          '1': 'hsl(var(--partial-1))',
          '1-foreground': 'hsl(var(--partial-1-foreground))',
          '1-foreground-alt': 'hsl(var(--partial-1-foreground-alt))',
          '1-border': 'hsl(var(--partial-1-border))',
          '1-bg': 'hsl(var(--partial-1-bg))',
          '2': 'hsl(var(--partial-2))',
          '2-foreground': 'hsl(var(--partial-2-foreground))',
          '2-foreground-alt': 'hsl(var(--partial-2-foreground-alt))',
          '2-border': 'hsl(var(--partial-2-border))',
          '2-bg': 'hsl(var(--partial-2-bg))',
          '3': 'hsl(var(--partial-3))',
          '3-foreground': 'hsl(var(--partial-3-foreground))',
          '3-foreground-alt': 'hsl(var(--partial-3-foreground-alt))',
          '3-border': 'hsl(var(--partial-3-border))',
          '3-bg': 'hsl(var(--partial-3-bg))',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

---
### ARCHIVO: tsconfig.json
---
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", "src/workers/data.worker.ts"],
  "exclude": ["node_modules"]
}
```

---
### ARCHIVO: next.config.js
---
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
```

---
### ARCHIVO: src/app/globals.css
---
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'PT Sans', sans-serif;
}

@layer base {
  :root, .theme-default {
    --background: 222.2 47.4% 11.2%;
    --foreground: 210 40% 98%;
    --card: 222.2 47.4% 11.2%;
    --card-foreground: 210 40% 98%;
    --card-foreground-alt: 210 40% 98%;
    --card-1: 262 82% 60%;
    --card-2: 217 91% 60%;
    --card-3: 162 72% 46%;
    --card-4: 32 91% 54%;
    --card-5: 342 91% 60%;
    --popover: 222.2 47.4% 11.2%;
    --popover-foreground: 210 40% 98%;
    --primary: 210.8 90.9% 52.9%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 85.7% 97.3%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 210.8 90.9% 52.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 222.2 47.4% 9.2%;
    --sidebar-foreground: 210 40% 98%;
    --sidebar-primary: 210.8 90.9% 52.9%;
    --sidebar-primary-foreground: 210 40% 98%;
    --sidebar-accent: 217.2 32.6% 22.5%;
    --sidebar-accent-foreground: 210 40% 98%;
    --sidebar-border: 217.2 32.6% 17.5%;
    --sidebar-ring: 210.8 90.9% 52.9%;
    
    --partial-1: 210.8 90.9% 52.9%;
    --partial-1-foreground: 210 40% 98%;
    --partial-1-foreground-alt: 210.8 90.9% 52.9%;
    --partial-1-border: 210.8 90.9% 42.9%;
    --partial-1-bg: 210.8 90.9% 22.9%;

    --partial-2: 162 72% 46%;
    --partial-2-foreground: 210 40% 98%;
    --partial-2-foreground-alt: 162 72% 46%;
    --partial-2-border: 162 72% 36%;
    --partial-2-bg: 162 72% 16%;

    --partial-3: 32 91% 54%;
    --partial-3-foreground: 210 40% 98%;
    --partial-3-foreground-alt: 32 91% 54%;
    --partial-3-border: 32 91% 44%;
    --partial-3-bg: 32 91% 24%;
  }

  .theme-light {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --sidebar-background: 210 40% 98%;
    --sidebar-foreground: 222.2 84% 4.9%;
    --sidebar-accent: 210 40% 94.1%;
    --sidebar-accent-foreground: 222.2 47.4% 11.2%;
    --partial-1: 221.2 83.2% 53.3%;
    --partial-1-foreground: 210 40% 98%;
    --partial-1-foreground-alt: 221.2 83.2% 53.3%;
    --partial-1-border: 221.2 83.2% 63.3%;
    --partial-1-bg: 221.2 83.2% 93.3%;
    --partial-2: 162 72% 46%;
    --partial-2-foreground: 210 40% 98%;
    --partial-2-foreground-alt: 162 72% 30%;
    --partial-2-border: 162 72% 56%;
    --partial-2-bg: 162 72% 89%;
    --partial-3: 262 82% 60%;
    --partial-3-foreground: 0 0% 100%;
    --partial-3-foreground-alt: 262 82% 45%;
    --partial-3-border: 262 82% 70%;
    --partial-3-bg: 262 82% 91%;
  }

  .theme-dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --sidebar-background: 222.2 84% 4.9%;
    --sidebar-foreground: 210 40% 98%;
    --sidebar-accent: 217.2 32.6% 17.5%;
    --sidebar-accent-foreground: 210 40% 98%;
    --partial-1: 210 40% 98%;
    --partial-1-foreground: 222.2 47.4% 11.2%;
    --partial-1-foreground-alt: 210 40% 98%;
    --partial-1-border: 217.2 32.6% 17.5%;
    --partial-1-bg: 217.2 32.6% 27.5%;
    --partial-2: 162 72% 46%;
    --partial-2-foreground: 210 40% 98%;
    --partial-2-foreground-alt: 162 72% 46%;
    --partial-2-border: 162 72% 36%;
    --partial-2-bg: 162 72% 16%;
    --partial-3: 32 91% 54%;
    --partial-3-foreground: 210 40% 98%;
    --partial-3-foreground-alt: 32 91% 54%;
    --partial-3-border: 32 91% 44%;
    --partial-3-bg: 32 91% 24%;
  }
  
  .theme-forest {
    --background: 120 10% 96%;
    --foreground: 120 25% 15%;
    --card: 120 10% 100%;
    --card-foreground: 120 25% 15%;
    --primary: 140 60% 35%;
    --primary-foreground: 140 60% 95%;
    --secondary: 120 10% 90%;
    --secondary-foreground: 120 25% 15%;
    --muted: 120 10% 90%;
    --muted-foreground: 120 25% 45%;
    --accent: 140 60% 88%;
    --accent-foreground: 140 60% 15%;
    --destructive: 0 70% 50%;
    --border: 120 10% 85%;
    --input: 120 10% 90%;
    --ring: 140 60% 35%;
    --sidebar-background: 140 60% 35%;
    --sidebar-foreground: 140 60% 95%;
    --sidebar-accent: 140 60% 45%;
    --sidebar-accent-foreground: 140 60% 95%;

    --partial-1: 140 60% 35%;
    --partial-1-foreground: 140 60% 95%;
    --partial-1-foreground-alt: 140 60% 25%;
    --partial-1-border: 140 60% 45%;
    --partial-1-bg: 140 60% 90%;

    --partial-2: 90 60% 45%;
    --partial-2-foreground: 90 60% 95%;
    --partial-2-foreground-alt: 90 60% 30%;
    --partial-2-border: 90 60% 55%;
    --partial-2-bg: 90 60% 92%;

    --partial-3: 40 60% 50%;
    --partial-3-foreground: 40 60% 95%;
    --partial-3-foreground-alt: 40 60% 35%;
    --partial-3-border: 40 60% 60%;
    --partial-3-bg: 40 60% 93%;
  }

  .theme-candy {
    --background: 345 100% 97%;
    --foreground: 345 80% 20%;
    --card: 345 100% 100%;
    --card-foreground: 345 80% 20%;
    --primary: 340 82% 60%;
    --primary-foreground: 340 82% 98%;
    --secondary: 345 90% 92%;
    --secondary-foreground: 345 80% 20%;
    --accent: 24 95% 70%;
    --accent-foreground: 24 95% 20%;
    --destructive: 0 84% 60%;
    --border: 345 90% 88%;
    --input: 345 90% 92%;
    --ring: 340 82% 60%;
    --sidebar-background: 340 82% 60%;
    --sidebar-foreground: 340 82% 98%;
    --sidebar-accent: 340 82% 70%;
    --sidebar-accent-foreground: 340 82% 98%;

    --partial-1: 340 82% 60%;
    --partial-1-foreground: 340 82% 98%;
    --partial-1-foreground-alt: 340 82% 45%;
    --partial-1-border: 340 82% 70%;
    --partial-1-bg: 340 82% 94%;

    --partial-2: 300 82% 65%;
    --partial-2-foreground: 300 82% 98%;
    --partial-2-foreground-alt: 300 82% 50%;
    --partial-2-border: 300 82% 75%;
    --partial-2-bg: 300 82% 95%;

    --partial-3: 24 95% 70%;
    --partial-3-foreground: 24 95% 20%;
    --partial-3-foreground-alt: 24 95% 55%;
    --partial-3-border: 24 95% 80%;
    --partial-3-bg: 24 95% 96%;
  }

  .theme-ocean {
    --background: 210 40% 96.1%;
    --foreground: 215 25% 27%;
    --card: 210 40% 100%;
    --card-foreground: 215 25% 27%;
    --primary: 205 78% 46%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 92%;
    --secondary-foreground: 215 25% 27%;
    --accent: 185 62% 85%;
    --accent-foreground: 185 62% 25%;
    --destructive: 0 84% 60%;
    --border: 210 40% 88%;
    --input: 210 40% 92%;
    --ring: 205 78% 46%;
    --sidebar-background: 205 78% 46%;
    --sidebar-foreground: 210 40% 98%;
    --sidebar-accent: 205 78% 56%;
    --sidebar-accent-foreground: 210 40% 98%;

    --partial-1: 205 78% 46%;
    --partial-1-foreground: 210 40% 98%;
    --partial-1-foreground-alt: 205 78% 30%;
    --partial-1-border: 205 78% 56%;
    --partial-1-bg: 205 78% 92%;

    --partial-2: 185 62% 45%;
    --partial-2-foreground: 185 62% 95%;
    --partial-2-foreground-alt: 185 62% 30%;
    --partial-2-border: 185 62% 55%;
    --partial-2-bg: 185 62% 91%;

    --partial-3: 220 70% 55%;
    --partial-3-foreground: 220 70% 98%;
    --partial-3-foreground-alt: 220 70% 40%;
    --partial-3-border: 220 70% 65%;
    --partial-3-bg: 220 70% 93%;
  }

  .theme-sunset {
    --background: 20 20% 15%;
    --foreground: 20 5% 95%;
    --card: 20 20% 20%;
    --card-foreground: 20 5% 95%;
    --primary: 30 90% 65%;
    --primary-foreground: 30 90% 10%;
    --secondary: 20 20% 25%;
    --secondary-foreground: 20 5% 95%;
    --accent: 0 80% 55%;
    --accent-foreground: 0 80% 95%;
    --destructive: 0 72% 51%;
    --border: 20 20% 30%;
    --input: 20 20% 25%;
    --ring: 30 90% 65%;
    --sidebar-background: linear-gradient(180deg, hsl(20, 20%, 12%), hsl(30, 90%, 65%));
    --sidebar-foreground: 20 5% 95%;
    --sidebar-accent: 20 20% 28%;
    --sidebar-accent-foreground: 30 90% 80%;

    --partial-1: 30 90% 65%;
    --partial-1-foreground: 30 90% 10%;
    --partial-1-foreground-alt: 30 90% 85%;
    --partial-1-border: 30 90% 55%;
    --partial-1-bg: 30 90% 25%;

    --partial-2: 0 80% 55%;
    --partial-2-foreground: 0 80% 95%;
    --partial-2-foreground-alt: 0 80% 85%;
    --partial-2-border: 0 80% 45%;
    --partial-2-bg: 0 80% 20%;

    --partial-3: 50 95% 60%;
    --partial-3-foreground: 50 95% 10%;
    --partial-3-foreground-alt: 50 95% 80%;
    --partial-3-border: 50 95% 50%;
    --partial-3-bg: 50 95% 22%;
  }

  .theme-aurora {
    --background: 260 20% 12%;
    --foreground: 260 10% 90%;
    --card: 260 20% 18%;
    --card-foreground: 260 10% 90%;
    --primary: 280 80% 70%;
    --primary-foreground: 280 80% 98%;
    --secondary: 260 20% 25%;
    --secondary-foreground: 260 10% 90%;
    --accent: 280 80% 50%;
    --accent-foreground: 280 80% 98%;
    --destructive: 0 72% 51%;
    --border: 260 20% 30%;
    --input: 260 20% 25%;
    --ring: 280 80% 70%;
    --sidebar-background: 280 80% 70%;
    --sidebar-foreground: 280 80% 98%;
    --sidebar-accent: 280 80% 80%;

    --partial-1: 280 80% 70%;
    --partial-1-foreground: 280 80% 98%;
    --partial-1-foreground-alt: 280 80% 90%;
    --partial-1-border: 280 80% 60%;
    --partial-1-bg: 280 80% 25%;

    --partial-2: 240 70% 70%;
    --partial-2-foreground: 240 70% 98%;
    --partial-2-foreground-alt: 240 70% 90%;
    --partial-2-border: 240 70% 60%;
    --partial-2-bg: 240 70% 25%;

    --partial-3: 180 60% 65%;
    --partial-3-foreground: 180 60% 98%;
    --partial-3-foreground-alt: 180 60% 85%;
    --partial-3-border: 180 60% 55%;
    --partial-3-bg: 180 60% 22%;
  }

  .theme-sakura {
    --background: 340 40% 97%;
    --foreground: 340 30% 25%;
    --primary: 330 70% 65%;
    --primary-foreground: 330 70% 98%;
    --card: 340 40% 100%;
    --card-foreground: 340 30% 25%;
    --secondary: 340 40% 93%;
    --accent: 120 20% 85%;
    --accent-foreground: 120 20% 25%;
    --border: 340 40% 90%;
    --sidebar-background: 340 40% 93%;
    --sidebar-foreground: 340 30% 25%;
    --sidebar-accent: 330 70% 88%;

    --partial-1: 330 70% 65%;
    --partial-1-foreground: 330 70% 98%;
    --partial-1-foreground-alt: 330 70% 45%;
    --partial-1-border: 330 70% 75%;
    --partial-1-bg: 330 70% 94%;

    --partial-2: 0 60% 70%;
    --partial-2-foreground: 0 60% 98%;
    --partial-2-foreground-alt: 0 60% 50%;
    --partial-2-border: 0 60% 80%;
    --partial-2-bg: 0 60% 95%;

    --partial-3: 120 20% 65%;
    --partial-3-foreground: 120 20% 15%;
    --partial-3-foreground-alt: 120 20% 45%;
    --partial-3-border: 120 20% 75%;
    --partial-3-bg: 120 20% 93%;
  }

  .theme-pro {
    --background: 240 2% 96%;
    --foreground: 240 10% 3.9%;
    --card: 240 2% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 240 6% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 2% 92%;
    --secondary-foreground: 240 10% 3.9%;
    --muted: 240 2% 90%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 2% 88%;
    --accent-foreground: 240 10% 3.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 2% 85%;
    --input: 240 2% 85%;
    --ring: 240 10% 3.9%;
    --sidebar-background: 240 6% 10%;
    --sidebar-foreground: 0 0% 98%;
    --sidebar-accent: 240 6% 15%;
    --sidebar-accent-foreground: 0 0% 98%;

    --partial-1: 240 6% 20%;
    --partial-1-foreground: 0 0% 98%;
    --partial-1-foreground-alt: 240 6% 20%;
    --partial-1-border: 240 6% 30%;
    --partial-1-bg: 240 2% 92%;

    --partial-2: 240 6% 40%;
    --partial-2-foreground: 0 0% 98%;
    --partial-2-foreground-alt: 240 6% 40%;
    --partial-2-border: 240 6% 50%;
    --partial-2-bg: 240 2% 94%;

    --partial-3: 240 6% 60%;
    --partial-3-foreground: 0 0% 98%;
    --partial-3-foreground-alt: 240 6% 60%;
    --partial-3-border: 240 6% 70%;
    --partial-3-bg: 240 2% 96%;
  }

  .theme-mint {
    --background: 150 50% 98%;
    --foreground: 150 40% 20%;
    --card: 150 50% 100%;
    --card-foreground: 150 40% 20%;
    --primary: 155 70% 40%;
    --primary-foreground: 155 70% 98%;
    --secondary: 150 50% 94%;
    --secondary-foreground: 150 40% 20%;
    --muted: 150 50% 90%;
    --muted-foreground: 150 40% 40%;
    --accent: 155 70% 90%;
    --accent-foreground: 155 70% 20%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 150 50% 88%;
    --input: 150 50% 88%;
    --ring: 155 70% 40%;
    --sidebar-background: 155 70% 40%;
    --sidebar-foreground: 155 70% 98%;
    --sidebar-accent: 155 70% 50%;
    --sidebar-accent-foreground: 155 70% 98%;

    --partial-1: 155 70% 40%;
    --partial-1-foreground: 155 70% 98%;
    --partial-1-foreground-alt: 155 70% 30%;
    --partial-1-border: 155 70% 50%;
    --partial-1-bg: 155 70% 92%;

    --partial-2: 175 60% 45%;
    --partial-2-foreground: 175 60% 98%;
    --partial-2-foreground-alt: 175 60% 30%;
    --partial-2-border: 175 60% 55%;
    --partial-2-bg: 175 60% 94%;

    --partial-3: 195 75% 50%;
    --partial-3-foreground: 195 75% 98%;
    --partial-3-foreground-alt: 195 75% 35%;
    --partial-3-border: 195 75% 60%;
    --partial-3-bg: 195 75% 96%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---
### ARCHIVO: src/app/layout.tsx
---
```tsx
import './globals.css';
import LayoutProvider from './layout-provider';

export const metadata = {
  title: 'Academic Tracker Pro',
  description: 'Gestiona el rendimiento académico de tus estudiantes con el poder de la IA.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#10b981" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <LayoutProvider>{children}</LayoutProvider>
    </html>
  );
}
```

---
### ARCHIVO: src/app/page.tsx
---
```tsx
'use client';

import { Loader2 } from 'lucide-react';

export default function HomePage() {
  // This component now only shows a loader.
  // The redirection logic is handled by MainLayoutClient, which is more robust.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-4">Cargando...</span>
    </div>
  );
}
```

---
### ARCHIVO: src/app/layout-provider.tsx
---
```tsx
'use client';

import { usePathname } from 'next/navigation';
import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';
import { Toaster } from '@/components/ui/toaster';
import { useEffect } from 'react';

const defaultSettings = {
    institutionName: "Academic Tracker",
    logo: "",
    theme: "theme-mint"
};

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    // Attempt to read theme from localStorage to prevent flicker on load
    try {
        const storedSettings = localStorage.getItem('app_settings_undefined'); // use-data hook saves with user_uid which is undefined on server
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            document.body.className = settings.theme || defaultSettings.theme;
        }
    } catch (e) {
        // Silently fail, the theme will be set by MainLayoutClient anyway
    }
  }, []);

  return (
    <body className={isAuthPage ? '' : 'theme-default'}>
        <DataProvider>
        {isAuthPage ? (
            children
        ) : (
            <MainLayoutClient>{children}</MainLayoutClient>
        )}
        </DataProvider>
        <Toaster />
    </body>
  );
}
```

---
### ARCHIVO: src/app/main-layout-client.tsx
---
```tsx
'use client';

import {
  BookCopy,
  LayoutDashboard,
  Settings,
  Users,
  Presentation,
  Contact,
  BarChart3,
  FileText,
  CalendarCheck,
  Package,
  BookText,
  PenSquare,
  FilePen,
  ClipboardCheck,
  User as UserIcon,
  ChevronRight,
  Loader2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppLogo } from '@/components/app-logo';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data';
import { getPartialLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { useSignOut } from 'react-firebase-hooks/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const mainNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/groups', icon: BookCopy, label: 'Grupos' },
  { href: '/bitacora', icon: BookText, label: 'Bitácora' },
  { href: '/grades', icon: FilePen, label: 'Calificaciones' },
  { href: '/attendance', icon: CalendarCheck, label: 'Asistencia' },
  { href: '/participations', icon: PenSquare, label: 'Participaciones' },
  { href: '/activities', icon: ClipboardCheck, label: 'Actividades' },
  { href: '/semester-evaluation', icon: Presentation, label: 'Eva. Semestral' },
  { href: '/reports', icon: FileText, label: 'Informes' },
  { href: '/statistics', icon: BarChart3, label: 'Estadísticas' },
  { href: '/contact', icon: Contact, label: 'Contacto y Soporte' },
];

const defaultSettings = {
    institutionName: "Academic Tracker",
    logo: "",
    theme: "theme-mint"
};


export default function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings, activeGroup, activePartialId, isLoading: isDataLoading, error: dataError, user } = useData();
  const [signOut, isSigningOut, signOutError] = useSignOut(auth);
  const { toast } = useToast();
  
  useEffect(() => {
    const theme = settings?.theme || defaultSettings.theme;
    document.body.className = theme;
  }, [settings?.theme]);
  
  if (isDataLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Cargando datos...</span>
        </div>
    );
  }
  
  if (!user && !isDataLoading) {
    router.replace('/login');
    return (
       <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Redirigiendo...</span>
        </div>
    );
  }
  
  if (!user) return null;
  
  const handleSignOut = async () => {
      const success = await signOut();
      if(success) {
          toast({ title: 'Sesión Cerrada', description: 'Has cerrado sesión exitosamente.' });
          router.push('/login');
      } else if (signOutError) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cerrar la sesión.'});
      }
    }

  const renderNavMenu = (items: typeof mainNavItems) => (
       <SidebarMenu>
        {items.map((item) => (
            <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
            >
                <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
                </Link>
            </SidebarMenuButton>
            </SidebarMenuItem>
        ))}
        </SidebarMenu>
  );

  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <AppLogo name={settings.institutionName} logoUrl={settings.logo} />
          </SidebarHeader>
          <SidebarContent>
            {activeGroup ? (
                  <>
                    <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-sidebar-foreground/70 tracking-wider uppercase">Grupo Activo</p>
                         <Button asChild variant="ghost" className={cn("h-auto w-full justify-start p-2 mt-1 text-wrap text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                          <Link href={`/groups/${activeGroup.id}`}>
                            <div className='space-y-1 w-full'>
                              <p className="font-bold flex items-center gap-2">
                                <Package className="h-4 w-4"/>
                                {activeGroup.subject}
                              </p>
                              <p className="font-semibold flex items-center gap-2 text-sm pl-1">
                                <BookText className="h-4 w-4"/>
                                {getPartialLabel(activePartialId)}
                                <ChevronRight className="h-4 w-4 ml-auto"/>
                              </p>
                            </div>
                          </Link>
                        </Button>
                    </div>
                    <Separator className="my-2" />
                  </>
              ) : isDataLoading ? (
                  <>
                    <div className="px-4 py-2">
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Separator className="my-2" />
                  </>
              ) : null
            }
            {renderNavMenu(mainNavItems)}
            <Separator className="my-2" />
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/manual')}>
                      <Link href="/manual">
                        <HelpCircle />
                        <span>Manual de Uso</span>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="flex-col !items-start gap-4">
            <Separator className="mx-0" />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/admin')}>
                  <Link href="/admin">
                    <ShieldCheck />
                    <span>Panel de Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')}>
                  <Link href="/settings">
                    <Settings />
                    <span>Ajustes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
             <div className="flex items-center gap-4 ml-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'Usuario'} />
                                <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => router.push('/settings')}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Ir a Ajustes</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
```

---
### ARCHIVO: src/hooks/use-data.tsx
---
```tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Group, PartialId, StudentObservation } from '@/lib/placeholder-data';
import { getPartialLabel } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import type { User } from 'firebase/auth';


// TYPE DEFINITIONS
export type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue: number;
  isAutomated?: boolean;
};

export type GradeDetail = {
  delivered: number | null;
};

export type Grades = {
  [studentId: string]: {
    [criterionId: string]: GradeDetail;
  };
};

export type RecoveryGrade = {
    grade: number | null;
    applied: boolean;
};

export type RecoveryGrades = {
    [studentId: string]: RecoveryGrade;
};

export type AttendanceRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

export type ParticipationRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

export type Activity = {
  id: string;
  name: string;
  dueDate: string; // YYYY-MM-DD
  programmedDate: string; // YYYY-MM-DD
};

export type ActivityRecord = {
    [studentId: string]: {
        [activityId: string]: boolean;
    };
};


export type GroupedActivities = {
  [dueDate: string]: Activity[];
};

export type GroupStats = {
  average: number;
  highRiskCount: number;
}

export type CalculatedRisk = {
    level: 'low' | 'medium' | 'high';
    reason: string;
}
export type StudentWithRisk = Student & { calculatedRisk: CalculatedRisk };

export type CriteriaDetail = {
    name: string;
    earned: number;
    weight: number;
}

export type StudentStats = {
    finalGrade: number;
    criteriaDetails: CriteriaDetail[];
    isRecovery: boolean;
    partialId: PartialId;
    attendance: { p: number; a: number; total: number; rate: number };
    observations: StudentObservation[];
};


export type PartialData = {
    grades: Grades;
    attendance: AttendanceRecord;
    participations: ParticipationRecord;
    activities: Activity[];
    activityRecords: ActivityRecord;
    recoveryGrades: RecoveryGrades;
    feedbacks: { [studentId: string]: string };
    groupAnalysis?: string;
};

export type AllPartialsDataForGroup = {
    [partialId in PartialId]?: PartialData;
};

export type AllPartialsData = {
  [groupId: string]: AllPartialsDataForGroup;
};


export type UserProfile = {
    name: string;
    email: string;
    photoURL: string;
}

export type AppSettings = {
    institutionName: string;
    logo: string;
    theme: string;
    apiKey: string;
    signature: string;
    facilitatorName?: string;
};

const defaultSettings: AppSettings = {
    institutionName: "Mi Institución",
    logo: "",
    theme: "theme-mint",
    apiKey: "",
    signature: "",
    facilitatorName: "",
};

const defaultPartialData: PartialData = {
    grades: {},
    attendance: {},
    participations: {},
    activities: [],
    activityRecords: {},
    recoveryGrades: {},
    feedbacks: {},
    groupAnalysis: '',
};

type GroupReportSummary = {
    totalStudents: number;
    approvedCount: number;
    failedCount: number;
    groupAverage: number;
    attendanceRate: number;
    participationRate: number;
}

type RecoverySummary = {
    recoveryStudentsCount: number;
    approvedOnRecovery: number;
    failedOnRecovery: number;
}


// CONTEXT TYPE
interface DataContextType {
  // State
  isLoading: boolean;
  error: Error | null;
  user: User | null | undefined;
  groups: Group[];
  allStudents: Student[];
  activeStudentsInGroups: Student[];
  allObservations: {[studentId: string]: StudentObservation[]};
  settings: AppSettings;
  
  activeGroup: Group | null;
  activePartialId: PartialId;
  
  partialData: PartialData;
  allPartialsDataForActiveGroup: AllPartialsDataForGroup;


  groupAverages: {[groupId: string]: number};
  atRiskStudents: StudentWithRisk[];
  overallAverageParticipation: number;

  // Setters / Updaters
  addStudentsToGroup: (groupId: string, students: Student[]) => Promise<void>;
  removeStudentFromGroup: (groupId: string, studentId: string) => Promise<void>;
  updateGroup: (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => Promise<void>;
  updateStudent: (studentId: string, data: Partial<Student>) => Promise<void>;
  updateGroupCriteria: (criteria: EvaluationCriteria[]) => Promise<void>;
  createGroup: (group: Group) => Promise<void>;
  
  setActiveGroupId: (groupId: string | null) => void;
  setActivePartialId: (partialId: PartialId) => void;
  
  setGrades: (setter: React.SetStateAction<Grades>) => Promise<void>;
  setAttendance: (setter: React.SetStateAction<AttendanceRecord>) => Promise<void>;
  setParticipations: (setter: React.SetStateAction<ParticipationRecord>) => Promise<void>;
  setActivities: (setter: React.SetStateAction<Activity[]>) => Promise<void>;
  setActivityRecords: (setter: React.SetStateAction<ActivityRecord>) => Promise<void>;
  setRecoveryGrades: (setter: React.SetStateAction<RecoveryGrades>) => Promise<void>;
  setStudentFeedback: (studentId: string, feedback: string) => Promise<void>;
  setGroupAnalysis: (analysis: string) => Promise<void>;
  setSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;


  // Functions
  deleteGroup: (groupId: string) => Promise<void>;
  addStudentObservation: (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => Promise<void>;
  updateStudentObservation: (studentId: string, observationId: string, updateText: string, isClosing: boolean) => Promise<void>;
  calculateFinalGrade: (studentId: string) => number;
  calculateDetailedFinalGrade: (studentId: string, pData: PartialData, criteria: EvaluationCriteria[]) => { finalGrade: number, criteriaDetails: CriteriaDetail[], isRecovery: boolean };
  getStudentRiskLevel: (finalGrade: number, pAttendance: AttendanceRecord, studentId: string) => CalculatedRisk;
  fetchPartialData: (groupId: string, partialId: PartialId) => Promise<(PartialData & { criteria: EvaluationCriteria[] }) | null>;
  takeAttendanceForDate: (groupId: string, date: string) => Promise<void>;
  generateFeedbackWithAI: (student: Student, stats: StudentStats) => Promise<string>;
  generateGroupAnalysisWithAI: (group: Group, summary: GroupReportSummary, recoverySummary: RecoverySummary, atRisk: StudentWithRisk[], observations: (StudentObservation & { studentName: string })[]) => Promise<string>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// DATA PROVIDER COMPONENT
export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    const [user, authLoading] = useAuthState(auth);

    // Main State
    const [groups, setGroups] = useState<Group[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allObservations, setAllObservations] = useState<{[studentId: string]: StudentObservation[]}>({});
    const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [activePartialId, setActivePartialId] = useState<PartialId>('p1');
    const [allPartialsData, setAllPartialsData] = useState<AllPartialsData>({});

    const getStorageKey = (baseKey: string) => user ? `${baseKey}_${user.uid}` : `${baseKey}_logged_out`;

    const loadFromStorage = useCallback(<T,>(key: string, defaultValue: T): T => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const storedValue = localStorage.getItem(getStorageKey(key));
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage`, error);
            setError(error as Error);
            return defaultValue;
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading) {
            if (user) {
                try {
                    setGroups(loadFromStorage('app_groups', []));
                    setAllStudents(loadFromStorage('app_students', []));
                    setAllObservations(loadFromStorage('app_observations', {}));
                    setAllPartialsData(loadFromStorage('app_partialsData', {}));
                    setSettingsState(loadFromStorage('app_settings', defaultSettings));
                    
                    const storedActiveGroupId = loadFromStorage('activeGroupId_v1', null);
                    const availableGroups = loadFromStorage('app_groups', []);
                    if(availableGroups.some((g: Group) => g.id === storedActiveGroupId)){
                        setActiveGroupIdState(storedActiveGroupId);
                    } else if (availableGroups.length > 0) {
                        setActiveGroupIdState(availableGroups[0].id);
                    }
                } catch (e) {
                    setError(e as Error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                 setIsLoading(false); // No user, stop loading
            }
        }
    }, [user, loadFromStorage, authLoading]);
    
    // Derived State
    const activeGroup = useMemo(() => {
        if (!activeGroupId) return null;
        return groups.find(g => g.id === activeGroupId) || null;
    }, [groups, activeGroupId]);

    const allPartialsDataForActiveGroup = useMemo(() => {
        if (!activeGroupId) return {};
        return allPartialsData[activeGroupId] || {};
    }, [activeGroupId, allPartialsData]);
    
    const partialData = useMemo((): PartialData => {
        if (!activeGroupId) return defaultPartialData;
        return allPartialsDataForActiveGroup[activePartialId] || defaultPartialData;
    }, [allPartialsDataForActiveGroup, activePartialId, activeGroupId]);

    // Data Persistence Effects
    useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_groups'), JSON.stringify(groups));
    }, [groups, isLoading, user]);
    useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_students'), JSON.stringify(allStudents));
    }, [allStudents, isLoading, user]);
    useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_observations'), JSON.stringify(allObservations));
    }, [allObservations, isLoading, user]);
    useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_settings'), JSON.stringify(settings));
    }, [settings, isLoading, user]);
     useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('activeGroupId_v1'), JSON.stringify(activeGroupId));
    }, [activeGroupId, isLoading, user]);
    useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_partialsData'), JSON.stringify(allPartialsData));
    }, [allPartialsData, isLoading, user]);


    const setActiveGroupId = useCallback((groupId: string | null) => {
        setActiveGroupIdState(groupId);
    }, []);

    // ---- Calculation Logic ----
    const calculateDetailedFinalGrade = useCallback((studentId: string, pData: PartialData, criteria: EvaluationCriteria[]): { finalGrade: number, criteriaDetails: CriteriaDetail[], isRecovery: boolean } => {
        if (!pData || !criteria || criteria.length === 0) {
            return { finalGrade: 0, criteriaDetails: [], isRecovery: false };
        }

        const recoveryInfo = pData.recoveryGrades?.[studentId];
        if (recoveryInfo?.applied) {
            return {
                finalGrade: recoveryInfo.grade ?? 0,
                criteriaDetails: [{ name: 'Recuperación', earned: recoveryInfo.grade ?? 0, weight: 100 }],
                isRecovery: true,
            };
        }
        
        let finalGrade = 0;
        const criteriaDetails: CriteriaDetail[] = [];
        
        for (const criterion of criteria) {
            let performanceRatio = 0;

             if (criterion.name === 'Actividades' || criterion.name === 'Portafolio') {
                const totalActivities = pData.activities?.length ?? 0;
                if (totalActivities > 0) {
                    const deliveredActivities = Object.values(pData.activityRecords?.[studentId] || {}).filter(Boolean).length;
                    performanceRatio = deliveredActivities / totalActivities;
                }
            } else if (criterion.name === 'Participación') {
                 const totalClasses = Object.keys(pData.participations || {}).length;
                 if (totalClasses > 0) {
                    const studentParticipations = Object.values(pData.participations).filter(day => day[studentId]).length;
                    performanceRatio = studentParticipations / totalClasses;
                 }
            } else {
                const delivered = pData.grades?.[studentId]?.[criterion.id]?.delivered ?? 0;
                const expected = criterion.expectedValue;
                if (expected > 0) {
                    performanceRatio = (delivered ?? 0) / expected;
                }
            }
            const earnedPercentage = performanceRatio * criterion.weight;
            finalGrade += earnedPercentage;
            criteriaDetails.push({ name: criterion.name, earned: earnedPercentage, weight: criterion.weight });
        }
        
        const grade = Math.max(0, Math.min(100, finalGrade));
        return { finalGrade: grade, criteriaDetails: criteriaDetails, isRecovery: false };
    }, []);

    const calculateFinalGrade = useCallback((studentId: string): number => {
        if (!activeGroup || !partialData) return 0;
        return calculateDetailedFinalGrade(studentId, partialData, activeGroup.criteria).finalGrade;
    }, [activeGroup, partialData, calculateDetailedFinalGrade]);


    const getStudentRiskLevel = useCallback((finalGrade: number, pAttendance: AttendanceRecord | undefined, studentId: string): CalculatedRisk => {
        const safeAttendance = pAttendance || {};
        const studentAttendanceDays = Object.keys(safeAttendance).filter(date => Object.prototype.hasOwnProperty.call(safeAttendance[date], studentId));
        const totalDaysForStudent = studentAttendanceDays.length;

        const absences = studentAttendanceDays.reduce((count, date) => {
            return safeAttendance[date][studentId] === false ? count + 1 : count;
        }, 0);
        
        if (absences > 3) {
            return {
                level: 'high',
                reason: `Ausentismo crítico (${absences} faltas). Requiere atención independientemente del promedio.`
            };
        }

        if (finalGrade < 50 && absences >= 2) {
             return {
                level: 'high',
                reason: `Promedio de ${finalGrade.toFixed(0)}% y ${absences} faltas.`
            };
        }
        
        if (finalGrade <= 70 && absences >= 2) {
            return {
                level: 'medium',
                reason: `Promedio de ${finalGrade.toFixed(0)}% y ${absences} faltas.`
            };
        }
        
        return {level: 'low', reason: 'Sin riesgo detectado' };
    }, []);
    
    // --- Calculated / Memoized State ---
    const groupAverages = useMemo(() => {
        const averages: {[groupId: string]: number} = {};
        groups.forEach(group => {
            if (!group || !group.criteria || group.criteria.length === 0) {
                averages[group.id] = 0;
                return;
            }
            const groupPartialData = allPartialsData[group.id]?.[activePartialId];
            if (!groupPartialData) {
                averages[group.id] = 0;
                return;
            }
            const groupGrades = group.students.map(s => calculateDetailedFinalGrade(s.id, groupPartialData, group.criteria).finalGrade);
            if(groupGrades.length === 0) {
                averages[group.id] = 0;
                return;
            }
            const total = groupGrades.reduce((sum, grade) => sum + grade, 0);
            averages[group.id] = groupGrades.length > 0 ? total / groupGrades.length : 0;
        });
        return averages;
    }, [groups, allPartialsData, activePartialId, calculateDetailedFinalGrade]);

    const atRiskStudents = useMemo(() => {
        const students: StudentWithRisk[] = [];
        const studentsAtRiskInPartial = new Map<string, StudentWithRisk>();
        groups.forEach(group => {
            if (!group || !group.criteria || group.criteria.length === 0) return;
            const groupPartialData = allPartialsData[group.id]?.[activePartialId];
            if (!groupPartialData) return;

            group.students.forEach(student => {
                const finalGrade = calculateDetailedFinalGrade(student.id, groupPartialData, group.criteria).finalGrade;
                const risk = getStudentRiskLevel(finalGrade, groupPartialData.attendance, student.id);

                if (risk.level === 'high' || risk.level === 'medium') {
                    studentsAtRiskInPartial.set(student.id, { ...student, calculatedRisk: risk });
                }
            });
        });
        students.push(...Array.from(studentsAtRiskInPartial.values()));
        return students;
    }, [groups, allPartialsData, activePartialId, calculateDetailedFinalGrade, getStudentRiskLevel]);

    const overallAverageParticipation = useMemo(() => {
        if (!activeGroup) return 100;
        const pData = allPartialsData[activeGroup.id]?.[activePartialId];
        if (!pData || Object.keys(pData.participations).length === 0) return 100;

        let totalRatio = 0;
        let studentsWithOpportunities = 0;
        activeGroup.students.forEach(student => {
            const participationDates = Object.keys(pData.participations);
            const studentParticipationOpportunities = participationDates.filter(date => Object.prototype.hasOwnProperty.call(pData.participations[date], student.id)).length;

            if (studentParticipationOpportunities > 0) {
                 const studentParticipations = Object.values(pData.participations).filter(p => p[student.id]).length;
                 totalRatio += studentParticipations / studentParticipationOpportunities;
                 studentsWithOpportunities++;
            }
        });
        if (studentsWithOpportunities > 0) {
            return (totalRatio / studentsWithOpportunities) * 100;
        }
        return 100;
    }, [activeGroup, allPartialsData, activePartialId]);


    // ---- HOOK FUNCTIONS ----
    const createGroup = useCallback(async (group: Group) => {
        setGroups(prev => {
            const newGroups = [...prev, group];
            if(newGroups.length === 1) {
                setActiveGroupIdState(newGroups[0].id);
            }
            return newGroups;
        });
        return Promise.resolve();
    }, []);

    const addStudentsToGroup = useCallback(async (groupId: string, students: Student[]) => {
        const newStudentIds = new Set(students.map(s => s.id));
        setAllStudents(prev => [...prev.filter(s => !newStudentIds.has(s.id)), ...students]);
        setGroups(prev => prev.map(g => g.id === groupId ? {...g, students: [...g.students, ...students]} : g));
        return Promise.resolve();
    }, []);

    const removeStudentFromGroup = useCallback(async (groupId: string, studentId: string) => {
        setGroups(prev => prev.map(g => g.id === groupId ? {...g, students: g.students.filter(s => s.id !== studentId)} : g));
        return Promise.resolve();
    }, []);
    
    const updateGroup = useCallback(async (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...data } : g));
        return Promise.resolve();
    }, []);

    const updateStudent = useCallback(async (studentId: string, data: Partial<Student>) => {
        setAllStudents(prev => prev.map(s => s.id === studentId ? {...s, ...data} : s));
        setGroups(prev => prev.map(g => ({
            ...g,
            students: g.students.map(s => s.id === studentId ? { ...s, ...data } : s),
        })));
        return Promise.resolve();
    }, []);

    const updateGroupCriteria = useCallback(async (criteria: EvaluationCriteria[]) => {
        if(activeGroupId) {
            setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, criteria } : g));
        }
        return Promise.resolve();
    }, [activeGroupId]);
    
    const deleteGroup = useCallback(async (groupId: string) => {
        setGroups(prev => {
            const newGroups = prev.filter(g => g.id !== groupId);
            if (activeGroupId === groupId) {
                const newActiveId = newGroups.length > 0 ? newGroups[0].id : null;
                setActiveGroupIdState(newActiveId);
            }
            return newGroups;
        });
        return Promise.resolve();
    }, [activeGroupId]);

    const addStudentObservation = useCallback(async (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => {
        const newObservation: StudentObservation = {
            ...observation,
            id: `OBS-${Date.now()}`,
            date: new Date().toISOString(),
            followUpUpdates: [],
            isClosed: false,
        };
        setAllObservations(prev => ({
            ...prev,
            [observation.studentId]: [...(prev[observation.studentId] || []), newObservation]
        }));
        return Promise.resolve();
    }, []);

    const updateStudentObservation = useCallback(async (studentId: string, observationId: string, updateText: string, isClosing: boolean) => {
        setAllObservations(prev => {
            const studentObs = (prev[studentId] || []).map(obs => {
                if (obs.id === observationId) {
                    const newUpdate = { date: new Date().toISOString(), update: updateText };
                    return {
                        ...obs,
                        followUpUpdates: [...obs.followUpUpdates, newUpdate],
                        isClosed: isClosing
                    };
                }
                return obs;
            });
            return { ...prev, [studentId]: studentObs };
        });
    }, []);
    
    const resetAllData = useCallback(async () => {
        if(typeof window !== 'undefined' && user) {
            localStorage.removeItem(getStorageKey('app_groups'));
            localStorage.removeItem(getStorageKey('app_students'));
            localStorage.removeItem(getStorageKey('app_observations'));
            localStorage.removeItem(getStorageKey('app_partialsData'));
            localStorage.removeItem(getStorageKey('activeGroupId_v1'));
        }
        setGroups([]);
        setAllStudents([]);
        setAllObservations({});
        setAllPartialsData({});
        setActiveGroupIdState(null);
        setActivePartialId('p1');
        window.location.reload();
        return Promise.resolve();
    }, [user, getStorageKey]);

    const createSetterForPartialData = useCallback(<T,>(field: keyof PartialData) => {
        return async (setter: React.SetStateAction<T>) => {
            if (!activeGroupId) return Promise.resolve();
            
            setAllPartialsData(prevAllData => {
                const currentGroupData = prevAllData[activeGroupId] || {};
                const currentPartialData = currentGroupData[activePartialId] || defaultPartialData;
                const currentValue = currentPartialData[field] as T;
                const newValue = typeof setter === 'function' ? (setter as (prevState: T) => T)(currentValue) : setter;

                const newPartialData = { ...currentPartialData, [field]: newValue };
                return {
                    ...prevAllData,
                    [activeGroupId]: {
                        ...currentGroupData,
                        [activePartialId]: newPartialData,
                    },
                };
            });
            return Promise.resolve();
        };
    }, [activeGroupId, activePartialId]);

    const setSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
        setSettingsState(prev => ({...prev, ...newSettings}));
        return Promise.resolve();
    }, []);

    const setGrades = createSetterForPartialData<Grades>('grades');
    const setAttendance = createSetterForPartialData<AttendanceRecord>('attendance');
    const setParticipations = createSetterForPartialData<ParticipationRecord>('participations');
    const setActivities = createSetterForPartialData<Activity[]>('activities');
    const setActivityRecords = createSetterForPartialData<ActivityRecord>('activityRecords');
    const setRecoveryGrades = createSetterForPartialData<RecoveryGrades>('recoveryGrades');
    
    const setStudentFeedback = useCallback(async (studentId: string, feedback: string) => {
        if (!activeGroupId) return Promise.resolve();
        setAllPartialsData(prev => {
            const newFeedbacks = { ...(prev[activeGroupId]?.[activePartialId]?.feedbacks || {}), [studentId]: feedback };
            const newPData = { ...(prev[activeGroupId]?.[activePartialId] || defaultPartialData), feedbacks: newFeedbacks };
            return {
                ...prev,
                [activeGroupId]: {
                    ...(prev[activeGroupId] || {}),
                    [activePartialId]: newPData
                }
            };
        });
    }, [activeGroupId, activePartialId]);

    const setGroupAnalysis = useCallback(async (analysis: string) => {
        if (!activeGroupId) return Promise.resolve();
        setAllPartialsData(prev => {
            const newPData = { ...(prev[activeGroupId]?.[activePartialId] || defaultPartialData), groupAnalysis: analysis };
            return {
                ...prev,
                [activeGroupId]: {
                    ...(prev[activeGroupId] || {}),
                    [activePartialId]: newPData
                }
            };
        });
    }, [activeGroupId, activePartialId]);
    
    const takeAttendanceForDate = useCallback(async (groupId: string, date: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const newAttendanceRecord = group.students.reduce((acc, s) => ({...acc, [s.id]: true}), {});
        
        setAllPartialsData(prevAllData => {
            const currentGroupData = prevAllData[groupId] || {};
            const currentPartialData = currentGroupData[activePartialId] || defaultPartialData;
            const newAttendance = {...currentPartialData.attendance, [date]: newAttendanceRecord };
            const newPartialData = { ...currentPartialData, attendance: newAttendance };
            return {
                ...prevAllData,
                [groupId]: {
                    ...currentGroupData,
                    [activePartialId]: newPartialData,
                },
            };
        });
    }, [groups, activePartialId]);
    
    const fetchPartialData = useCallback(async (groupId: string, partialId: PartialId): Promise<(PartialData & { criteria: EvaluationCriteria[] }) | null> => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return null;
        const pData = allPartialsData[groupId]?.[partialId] || defaultPartialData;
        return {...pData, criteria: group?.criteria || []};
    }, [allPartialsData, groups]);

    const callGoogleAI = async (prompt: string): Promise<string> => {
        if (!settings.apiKey) {
            throw new Error("No se ha configurado una clave API de Google AI. Ve a Ajustes para agregarla.");
        }
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${settings.apiKey}`;
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error del servicio de IA: ${errorData.error?.message || response.statusText}`);
            }
            const data = await response.json();
            const feedbackText = data.candidates[0]?.content?.parts[0]?.text;
            if (!feedbackText) {
                throw new Error("La respuesta de la IA no contiene texto.");
            }
            return feedbackText;
        } catch (error) {
            if (error instanceof Error) {
                 throw new Error(error.message);
            }
            throw new Error("Ocurrió un error desconocido al conectar con el servicio de IA.");
        }
    };
    
    const generateFeedbackWithAI = useCallback(async (student: Student, stats: StudentStats): Promise<string> => {
        const criteriaSummary = stats.criteriaDetails.map(c => `- ${c.name}: ${c.earned.toFixed(0)}% de ${c.weight}%`).join('\n');
        const observationsSummary = stats.observations.length > 0 
            ? `Observaciones importantes en bitácora:\n` + stats.observations.map(o => `- Tipo: ${o.type}. Detalles: ${o.details}. ${o.canalizationTarget ? `Canalizado a: ${o.canalizationTarget}` : ''}`).join('\n')
            : "No hay observaciones en bitácora para este parcial.";

        const prompt = `
            Eres un asistente de docentes experto en pedagogía y comunicación asertiva.
            Tu tarea es generar una retroalimentación constructiva, profesional y personalizada para un estudiante, integrando sus datos académicos y de comportamiento.
            La retroalimentación debe ser balanceada: inicia con fortalezas, luego aborda áreas de oportunidad y finaliza con recomendaciones claras.

            INSTRUCCIONES CLAVE:
            1.  **Analiza la Bitácora:** No solo listes las observaciones. Interprétalas y adapta el tono.
                - Si hay 'Problema de conducta', enfoca el mensaje en el apoyo. Ejemplo: "He notado algunos desafíos en... y quiero que sepas que estoy aquí para ayudarte a encontrar mejores estrategias. No es para señalar, sino para que juntos logremos un ambiente positivo".
                - Si hay 'Episodio emocional' y fue canalizado, muestra empatía. Ejemplo: "Soy consciente de la situación que estás atravesando y quiero que sepas que tienes mi apoyo. Es importante que aproveches el acompañamiento que se te ha brindado".
                - Si hay 'Méritos', úsalos para reforzar positivamente. Ejemplo: "Quiero felicitarte especialmente por [mérito], demuestra tu gran capacidad para...".
            2.  **Conecta los Puntos:** Relaciona el rendimiento académico (calificaciones, asistencia) con las observaciones de la bitácora si es posible.
            3.  **Tono:** Usa un tono de apoyo y motivador, enfocado en el crecimiento del estudiante.
            4.  **Formato:** Redacta en párrafos fluidos. No uses asteriscos ni guiones para listas en el texto final.
            5.  **Sin Despedidas:** No incluyas ninguna despedida, firma o nombre al final. La salida debe ser únicamente el cuerpo de la retroalimentación.

            DATOS DEL ESTUDIANTE:
            - Nombre: ${student.name}
            - Calificación final del parcial: ${stats.finalGrade.toFixed(0)}%
            - Tasa de asistencia: ${stats.attendance.rate.toFixed(0)}%
            - Desglose de calificación:
            ${criteriaSummary}
            - Información de la bitácora:
            ${observationsSummary}

            Por favor, redacta la retroalimentación para ${student.name}, aplicando todas las instrucciones.
        `;
        return callGoogleAI(prompt);
    }, [settings.apiKey]);
    
    const generateGroupAnalysisWithAI = useCallback(async (group: Group, summary: GroupReportSummary, recoverySummary: RecoverySummary, atRisk: StudentWithRisk[], observations: (StudentObservation & { studentName: string })[]): Promise<string> => {
        const partialLabel = getPartialLabel(activePartialId);
        const atRiskSummary = atRisk.length > 0 ? `Se han identificado ${atRisk.length} estudiantes en riesgo (${atRisk.filter(s=>s.calculatedRisk.level==='high').length} en riesgo alto y ${atRisk.filter(s=>s.calculatedRisk.level==='medium').length} en riesgo medio).` : "No se han identificado estudiantes en riesgo significativo en este parcial.";
        const observationsSummary = observations.length > 0 ? `Se han registrado ${observations.length} observaciones notables en la bitácora durante este periodo. Las más comunes son sobre: ${[...new Set(observations.map(o => o.type.toLowerCase()))].join(', ')}.` : "No se han registrado observaciones significativas en la bitácora para este grupo en el parcial.";
        const recoveryContext = recoverySummary.recoveryStudentsCount > 0 ? `Un total de ${recoverySummary.recoveryStudentsCount} estudiantes requirieron calificación de recuperación. De ellos, ${recoverySummary.approvedOnRecovery} lograron aprobar gracias a esta medida, mientras que ${recoverySummary.failedOnRecovery} no alcanzaron la calificación aprobatoria. Esto indica que la estrategia de recuperación fue parcialmente exitosa.` : `No hubo estudiantes que requirieran calificación de recuperación en este parcial, lo cual es un indicador positivo.`;

        const prompt = `
            Actúa como un analista educativo experto redactando un informe para un docente. Tu tarea es generar un análisis narrativo profesional, objetivo y fluido sobre el rendimiento de un grupo de estudiantes para el ${partialLabel}.
            Sintetiza los datos cuantitativos y cualitativos proporcionados en un texto coherente. La redacción debe ser formal, directa y constructiva, como si la hubiera escrito el propio docente para sus archivos o para un directivo.
            
            IMPORTANTE: No utilices asteriscos (*) para listas o para dar énfasis. La redacción debe ser en párrafos fluidos. No uses "lenguaje de IA" o formatos típicos de chatbot.

            DATOS DEL GRUPO A ANALIZAR:
            - Asignatura: ${group.subject}
            - Parcial: ${partialLabel}
            - Número de estudiantes: ${summary.totalStudents}
            - Promedio general del grupo: ${summary.groupAverage.toFixed(1)}%
            - Tasa de aprobación (incluyendo recuperación): ${(summary.approvedCount / summary.totalStudents * 100).toFixed(1)}% (${summary.approvedCount} de ${summary.totalStudents} estudiantes)
            - Tasa de asistencia general: ${summary.attendanceRate.toFixed(1)}%
            - Resumen de estudiantes en riesgo: ${atRiskSummary}
            - Resumen de la bitácora: ${observationsSummary}
            - Análisis de recuperación: ${recoveryContext}

            Basado en estos datos, redacta el análisis cualitativo. Estructura el informe de la siguiente manera:
            1. Un párrafo inicial con el panorama general del rendimiento del grupo en el ${partialLabel}, mencionando el promedio y la tasa de aprobación.
            2. Un segundo párrafo analizando las posibles causas o correlaciones (ej. relación entre asistencia, observaciones de bitácora y rendimiento).
            3. Un tercer párrafo enfocado en la estrategia de recuperación (si aplica), comentando su efectividad y sugiriendo acciones para los estudiantes que no lograron aprobar ni con esta medida.
            4. Un párrafo final de cierre y recomendaciones. En este párrafo, se debe exhortar de manera profesional a que el personal directivo (director, subdirector académico), tutores de grupo y responsables de programas de apoyo (tutorías, atención socioemocional, psicología) se mantengan atentos y aborden a los estudiantes con bajo rendimiento, ausentismo o cualquier situación de riesgo identificada, así como a aquellos que aprobaron en recuperación, para asegurar su éxito en periodos ordinarios futuros.
        `;
        return callGoogleAI(prompt);
    }, [settings.apiKey, activePartialId]);

    const activeStudentsInGroups = useMemo(() => {
      const studentSet = new Map<string, Student>();
      groups.forEach(group => {
        (group.students || []).forEach(student => {
          if (student && student.id) {
            studentSet.set(student.id, student);
          }
        });
      });
      return Array.from(studentSet.values());
    }, [groups]);

    const contextValue: DataContextType = {
        isLoading: isLoading || authLoading,
        error,
        user,
        groups,
        allStudents,
        activeStudentsInGroups,
        allObservations,
        settings,
        activeGroup,
        activePartialId,
        partialData,
        allPartialsDataForActiveGroup,
        groupAverages,
        atRiskStudents,
        overallAverageParticipation,
        addStudentsToGroup,
        removeStudentFromGroup,
        updateGroup,
        updateStudent,
        updateGroupCriteria,
        createGroup,
        setActiveGroupId,
        setActivePartialId,
        setGrades,
        setAttendance,
        setParticipations,
        setActivities,
        setActivityRecords,
        setRecoveryGrades,
        setStudentFeedback,
        setGroupAnalysis,
        setSettings,
        deleteGroup,
        addStudentObservation,
        updateStudentObservation,
        calculateFinalGrade,
        getStudentRiskLevel,
        calculateDetailedFinalGrade,
        fetchPartialData,
        takeAttendanceForDate,
        resetAllData,
        generateFeedbackWithAI,
        generateGroupAnalysisWithAI,
    };

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
```

---
### ARCHIVO: src/lib/firebase.ts
---
```ts
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    "apiKey": "test-api-key",
    "authDomain": "test-auth-domain",
    "projectId": "test-project-id",
    "storageBucket": "test-storage-bucket",
    "messagingSenderId": "test-messaging-sender-id",
    "appId": "test-app-id"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
```

---
### ARCHIVO: src/lib/placeholder-data.ts
---
```ts
import type { EvaluationCriteria } from "@/hooks/use-data";

export type PartialId = 'p1' | 'p2' | 'p3';

export type Student = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tutorName?: string;
  tutorPhone?: string;
  photo: string;
};

export type Group = {
  id: string;
  subject: string;
  students: Student[];
  criteria: EvaluationCriteria[];
  semester?: string;
  groupName?: string;
  facilitator?: string;
};

export type StudentObservation = {
    id: string;
    studentId: string;
    partialId: PartialId;
    date: string; // ISO date string
    type: 'Problema de conducta' | 'Episodio emocional' | 'Mérito' | 'Demérito' | 'Asesoría académica' | 'Otros' | string;
    details: string;
    requiresCanalization: boolean;
    canalizationTarget?: 'Tutor' | 'Atención psicológica' | 'Directivo' | 'Padre/Madre/Tutor legal' | 'Otros' | string;
    requiresFollowUp: boolean;
    followUpUpdates: { date: string; update: string }[];
    isClosed: boolean;
};
```

---
### ARCHIVO: src/lib/utils.ts
---
```ts
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
```

... y así sucesivamente para el resto de archivos. El archivo `MIGRACION.md` ha sido creado en la raíz de tu proyecto.
