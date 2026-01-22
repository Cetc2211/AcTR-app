'use client';

import React, { useEffect } from 'react';
import { useData } from '@/hooks/use-data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Megaphone, Calendar } from 'lucide-react';

export default function AnnouncementsPage() {
    const { announcements, markAnnouncementsAsRead } = useData();

    useEffect(() => {
        // Mark all as read when entering the page
        markAnnouncementsAsRead();
    }, [markAnnouncementsAsRead]);

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center gap-3 mb-8">
                <Megaphone className="h-8 w-8 text-primary" />
                <div>
                     <h1 className="text-3xl font-bold">Sala de Anuncios</h1>
                     <p className="text-muted-foreground">Comunicados importantes de la institución.</p>
                </div>
            </div>

            <div className="grid gap-6 max-w-4xl mx-auto">
                {announcements.length === 0 && (
                    <Card className="bg-muted/50 border-dashed py-12">
                        <div className="flex flex-col items-center justify-center text-center">
                            <Megaphone className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                            <CardTitle className="text-xl text-muted-foreground">No hay anuncios activos</CardTitle>
                            <CardDescription>
                                Estás al día con todas las novedades.
                            </CardDescription>
                        </div>
                    </Card>
                )}

                {announcements.map((ann) => (
                    <Card key={ann.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                             <div className="flex justify-between items-start">
                                <CardTitle className="text-xl font-bold text-primary">{ann.title}</CardTitle>
                                <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(ann.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                                </div>
                             </div>
                        </CardHeader>
                        <CardContent>
                            <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                                {ann.message}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
