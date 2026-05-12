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
  Megaphone,
  GraduationCap,
  ClipboardSignature,
  Shield,
  ChevronDown
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data';
import { useAdmin } from '@/hooks/use-admin';
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
import { auth, db } from '@/lib/firebase';
import { useSignOut, useAuthState } from 'react-firebase-hooks/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';


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
  const { settings, activeGroup, activePartialId, isLoading: isDataLoading, error: dataError, unreadAnnouncementsCount, officialGroups } = useData();
  const [user, authLoading] = useAuthState(auth);
  const [signOut, isSigningOut, signOutError] = useSignOut(auth);
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [isTrackingManager, setIsTrackingManager] = useState(false);
  const [allowOfflineAuthFallback, setAllowOfflineAuthFallback] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      setAllowOfflineAuthFallback(false);
      return;
    }

    if (typeof window === 'undefined' || navigator.onLine) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAllowOfflineAuthFallback(true);
      console.warn('Offline auth timeout reached in layout.');
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [authLoading]);

  const resolvedUser = user || auth.currentUser;
  const effectiveAuthLoading = authLoading && !allowOfflineAuthFallback && !resolvedUser;
  
  // Determine roles
    const isTutor = useMemo(() => {
      if (!resolvedUser?.email || !officialGroups) return false;
      const currentEmail = resolvedUser.email.toLowerCase().trim();
      return officialGroups.some(g => (g.tutorEmail || '').toLowerCase().trim() === currentEmail);
    }, [resolvedUser, officialGroups]);

  useEffect(() => {
    const loadTrackingRole = async () => {
      if (!resolvedUser?.email) {
        setIsTrackingManager(false);
        return;
      }

      try {
        const rolesDoc = await getDoc(doc(db, 'app_config', 'roles'));
        if (!rolesDoc.exists()) {
          setIsTrackingManager(false);
          return;
        }

        const data = rolesDoc.data() as { tracking_managers?: string[] };
        const managers = data.tracking_managers || [];
        const currentEmail = resolvedUser.email.toLowerCase().trim();
        setIsTrackingManager(managers.some((email) => email.toLowerCase().trim() === currentEmail));
      } catch (error) {
        console.error('Error loading tracking manager role:', error);
        setIsTrackingManager(false);
      }
    };

    loadTrackingRole();
  }, [resolvedUser?.email]);

  const docentesNavItems = useMemo(() => [
      { href: '/groups', icon: BookCopy, label: 'Grupos' },
      { href: '/activities', icon: ClipboardCheck, label: 'Actividades' },
      { href: '/attendance', icon: CalendarCheck, label: 'Asistencia' },
      { href: '/participations', icon: PenSquare, label: 'Participaciones' },
      { href: '/bitacora', icon: BookText, label: 'Bitácora' },
      { href: '/semester-evaluation', icon: Presentation, label: 'Eval. Semestral' },
  ], []);

  const recordsNavItems = useMemo(() => [
      { href: '/records', icon: ClipboardSignature, label: 'Actas' },
      { href: '/reports', icon: FileText, label: 'Informes' },
      { href: '/statistics', icon: BarChart3, label: 'Estadísticas' },
  ], []);

  const secondaryNavItems = useMemo(() => [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/announcements', icon: Megaphone, label: 'Anuncios', badge: unreadAnnouncementsCount > 0 ? unreadAnnouncementsCount : undefined },
      ...(isTutor ? [{ href: '/tutor', icon: GraduationCap, label: 'Tutoría' }] : []),
      { href: '/teacher-tracking', icon: Shield, label: 'Seguimiento Docente' },
      ...(isAdmin || isTrackingManager ? [{ href: '/admin/absences', icon: Users, label: 'Seguimiento' }] : []),
      { href: '/contact', icon: Contact, label: 'Contacto' },
  ], [isTutor, isAdmin, isTrackingManager, unreadAnnouncementsCount]);

  const isDocentesSectionActive = useMemo(
    () => docentesNavItems.some((item) => pathname.startsWith(item.href)),
    [docentesNavItems, pathname],
  );
  const isRecordsSectionActive = useMemo(
    () => recordsNavItems.some((item) => pathname.startsWith(item.href)),
    [recordsNavItems, pathname],
  );

  const [isDocentesOpen, setIsDocentesOpen] = useState(false);
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);

  useEffect(() => {
    if (isDocentesSectionActive) {
      setIsDocentesOpen(true);
    }
  }, [isDocentesSectionActive]);

  useEffect(() => {
    if (isRecordsSectionActive) {
      setIsRecordsOpen(true);
    }
  }, [isRecordsSectionActive]);

  useEffect(() => {
    const theme = settings?.theme || defaultSettings.theme;
    document.body.className = theme;
  }, [settings?.theme]);
  
  if (effectiveAuthLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Verificando sesión...</span>
        </div>
    );
  }

  if (!resolvedUser) {
    if (pathname !== '/login') {
         router.replace('/login');
    }
    return (
       <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Redirigiendo...</span>
        </div>
    );
  }

  if (pathname === '/') {
      router.replace('/dashboard');
      return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Redirigiendo al Dashboard...</span>
        </div>
      );
  }
  
  if (isDataLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Cargando datos...</span>
        </div>
    );
  }
  
  const handleSignOut = async () => {
      const success = await signOut();
      if(success) {
          toast({ title: 'Sesión Cerrada', description: 'Has cerrado sesión exitosamente.' });
          router.push('/login');
      } else if (signOutError) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cerrar la sesión.'});
      }
    }

  const renderNavMenu = (items: any[]) => (
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
                {item.badge && (
                    <div className="ml-auto bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold animate-pulse">
                        {item.badge}
                    </div>
                )}
                </Link>
            </SidebarMenuButton>
            </SidebarMenuItem>
        ))}
        </SidebarMenu>
  );

  const renderCollapsibleMenu = (
    title: string,
    icon: any,
    items: any[],
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    isActive: boolean,
  ) => {
    const GroupIcon = icon;

    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton isActive={isActive} onClick={() => onOpenChange(!isOpen)}>
            {GroupIcon ? <GroupIcon /> : null}
            <span>{title}</span>
            <ChevronDown className={cn('ml-auto transition-transform', isOpen && 'rotate-180')} />
          </SidebarMenuButton>
          {isOpen && (
            <SidebarMenuSub>
              {items.map((item) => (
                <SidebarMenuSubItem key={item.href}>
                  <SidebarMenuSubButton asChild isActive={pathname.startsWith(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    );
  };

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
            {renderCollapsibleMenu(
              'Docentes',
              Users,
              docentesNavItems,
              isDocentesOpen,
              setIsDocentesOpen,
              isDocentesSectionActive,
            )}
            {renderCollapsibleMenu(
              'Actas e informes',
              FileText,
              recordsNavItems,
              isRecordsOpen,
              setIsRecordsOpen,
              isRecordsSectionActive,
            )}
            <Separator className="my-2" />
            {renderNavMenu(secondaryNavItems)}
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
              {isAdmin && (
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin')}>
                    <Link href="/admin">
                        <ShieldCheck />
                        <span>Panel de Admin</span>
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              )}
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
