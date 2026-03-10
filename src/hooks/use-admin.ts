import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function useAdmin() {
  const [user, loadingAuth] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (loadingAuth) return;

      if (!user?.email) {
        setIsAdmin(false);
        setLoadingAdmin(false);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.email.toLowerCase()));
        setIsAdmin(adminDoc.exists());
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoadingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, loadingAuth]);

  return { isAdmin, loading: loadingAuth || loadingAdmin, user };
}