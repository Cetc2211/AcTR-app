
import { GraduationCap } from 'lucide-react';
import Image from 'next/image';

interface AppLogoProps {
    name?: string;
    logoUrl?: string;
}

export function AppLogo({ name = "Academic Tracker", logoUrl }: AppLogoProps) {
  // Divide el nombre en las primeras 2 palabras y el resto.
  const words = name.split(' ');
  const firstLine = words.slice(0, 2).join(' ');
  const restOfName = words.slice(2).join(' ');

  return (
    <div className="flex flex-col p-4">
      <div className="flex items-end gap-2">
        <div className="shrink-0">
          {logoUrl ? (
            <Image src={logoUrl} alt={`${name} Logo`} width={48} height={48} className="size-12 object-contain" />
          ) : (
            <GraduationCap className="size-12 text-sidebar-foreground" />
          )}
        </div>
        <div className="flex flex-col">
            <h1 className="text-lg font-bold text-sidebar-foreground leading-tight">
              <span>{firstLine}</span>
            </h1>
        </div>
      </div>
      {restOfName && (
        <h1 className="text-lg font-bold text-sidebar-foreground leading-tight mt-1">
            <span>{restOfName}</span>
        </h1>
      )}
    </div>
  );
}
