
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { FilePen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useData } from '@/hooks/use-data';

export default function GradesRedirectPage() {
  const router = useRouter();
  const { activeGroup, activePartialId } = useData();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeGroup) {
      router.replace(`/grades/${activeGroup.id}/grades?partial=${activePartialId}`);
    } else {
      setIsLoading(false);
    }
  }, [router, activeGroup, activePartialId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Redirigiendo...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
        <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                <div className="bg-muted rounded-full p-4">
                    <FilePen className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle>No hay un grupo activo</CardTitle>
                <CardDescription>
                    Para registrar calificaciones, por favor <Link href="/groups" className="text-primary underline">selecciona un grupo</Link> primero.
                </CardDescription>
            </CardContent>
        </Card>
    </div>
  );
}
