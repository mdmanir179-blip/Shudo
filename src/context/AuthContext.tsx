import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearAllDemoData: () => Promise<void>;
  authError: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearError = () => setAuthError(null);

  // Clean wipe of any dummy/demo orders and sample sheets
  const clearAllDemoData = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      // Delete any dummy orders
      const ordersQ = query(collection(db, 'orders'), where('ownerId', '==', uid));
      const ordersSnap = await getDocs(ordersQ);
      for (const d of ordersSnap.docs) {
        await deleteDoc(doc(db, 'orders', d.id));
      }

      // Delete any dummy sample sheets
      const docsQ = query(collection(db, 'documents'), where('ownerId', '==', uid));
      const docsSnap = await getDocs(docsQ);
      for (const d of docsSnap.docs) {
        await deleteDoc(doc(db, 'documents', d.id));
      }

      // Delete any dummy sheet logs
      const logsQ = query(collection(db, 'sheet_logs'), where('ownerId', '==', uid));
      const logsSnap = await getDocs(logsQ);
      for (const d of logsSnap.docs) {
        await deleteDoc(doc(db, 'sheet_logs', d.id));
      }
    } catch (e) {
      console.error('Error clearing demo data:', e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Seller User',
              photoURL: user.photoURL || '',
              createdAt: new Date().toISOString()
            });

            // Initialize default seller portal links (Flipkart, Amazon, Meesho, Swiggy, Blinkit)
            // WITHOUT any fake orders, fake sheets or fake audit logs
            await initializeSellerPortals(user.uid);
          }
        } catch (err) {
          console.error('Error checking user setup:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const initializeSellerPortals = async (userId: string) => {
    try {
      const portalsRef = collection(db, 'portals');
      const defaultPortals = [
        {
          name: 'Flipkart',
          platform: 'flipkart',
          url: 'https://seller.flipkart.com',
          category: 'ecommerce',
          color: '#2874F0',
          notes: 'Official Flipkart Seller Hub for orders and dispatches.'
        },
        {
          name: 'Amazon',
          platform: 'amazon',
          url: 'https://sellercentral.amazon.in',
          category: 'ecommerce',
          color: '#FF9900',
          notes: 'Amazon Seller Central dashboard and orders.'
        },
        {
          name: 'Meesho',
          platform: 'meesho',
          url: 'https://supplier.meesho.com',
          category: 'social_commerce',
          color: '#8B1E5D',
          notes: 'Meesho Supplier Panel order processing.'
        },
        {
          name: 'Swiggy',
          platform: 'swiggy',
          url: 'https://partner.swiggy.com',
          category: 'quick_commerce',
          color: '#FC8019',
          notes: 'Swiggy Partner live order management.'
        },
        {
          name: 'Blinkit',
          platform: 'blinkit',
          url: 'https://partner.blinkit.com',
          category: 'quick_commerce',
          color: '#0C831F',
          notes: 'Blinkit Partner quick fulfillment dashboard.'
        }
      ];

      for (const p of defaultPortals) {
        await addDoc(portalsRef, {
          ...p,
          ownerId: userId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Failed to initialize seller portals:', e);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      setAuthError(error.message || 'Failed to sign in with Google');
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error('Email Sign In Error:', error);
      setAuthError(error.message || 'Invalid email or password');
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      setAuthError(null);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
    } catch (error: any) {
      console.error('Sign Up Error:', error);
      setAuthError(error.message || 'Failed to create account');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        clearAllDemoData,
        authError,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext: AuthContextType = {
  currentUser: null,
  loading: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
  clearAllDemoData: async () => {},
  authError: null,
  clearError: () => {}
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
};
