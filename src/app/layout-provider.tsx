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
        const storedSettings = localStorage.getItem('app_settings'); 
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
