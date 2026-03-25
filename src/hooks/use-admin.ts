import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Cache admin status to avoid repeated Firestore calls during connection issues
let adminCache: { email: string; isAdmin: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useAdmin() {
  const [user, loadingAuth] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (loadingAuth) return;

      if (!user?.email) {
        console.log('[useAdmin] No user email found');
        setIsAdmin(false);
        setLoadingAdmin(false);
        return;
      }

      const emailLower = user.email.toLowerCase();
      console.log('[useAdmin] Checking admin status for:', emailLower);
      
      // Check cache first
      if (adminCache && 
          adminCache.email === emailLower && 
          Date.now() - adminCache.timestamp < CACHE_DURATION) {
        console.log('[useAdmin] Using cached admin status:', adminCache.isAdmin);
        setIsAdmin(adminCache.isAdmin);
        setLoadingAdmin(false);
        return;
      }
      
      try {
        const adminDoc = await getDoc(doc(db, 'admins', emailLower));
        console.log('[useAdmin] Admin doc exists:', adminDoc.exists());
        
        const adminStatus = adminDoc.exists();
        setIsAdmin(adminStatus);
        
        // Update cache
        adminCache = {
          email: emailLower,
          isAdmin: adminStatus,
          timestamp: Date.now()
        };
        
      } catch (error: any) {
        console.error("[useAdmin] Error checking admin status:", error);
        
        // On Firestore error, check if we have a cached value
        if (adminCache && adminCache.email === emailLower) {
          console.log('[useAdmin] Using cached admin status due to error:', adminCache.isAdmin);
          setIsAdmin(adminCache.isAdmin);
        } else {
          // If no cache, assume not admin for safety
          setIsAdmin(false);
        }
      } finally {
        setLoadingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, loadingAuth]);

  return { isAdmin, loading: loadingAuth || loadingAdmin, user };
}