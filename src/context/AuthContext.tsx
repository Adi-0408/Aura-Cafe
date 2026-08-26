import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { UserProfile, UserRole } from '../types';
import { syncUserToFirestore, fetchUsersFromFirestore, findUserByEmail } from '../services/firebaseService';

export interface StaffMember {
  uid: string;
  email: string;
  displayName: string;
  jobTitle: string;
  role: 'staff';
  password?: string;
  createdAt: number;
}

const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  {
    uid: 'staff-001',
    email: 'staff.sarah@auracoffee.com',
    displayName: 'Sarah Jenkins',
    jobTitle: 'Senior Barista & Shift Lead',
    role: 'staff',
    password: '1001',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    uid: 'staff-002',
    email: 'staff.marcus@auracoffee.com',
    displayName: 'Marcus Chen',
    jobTitle: 'Head Baker & Pastry Lead',
    role: 'staff',
    password: '1001',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
  }
];

const ADMIN_ACCOUNT: UserProfile = {
  uid: 'admin-aditya-001',
  email: 'adityapatil.4132@gmail.com',
  displayName: 'Aditya Patil',
  role: 'admin',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  lastLogin: Date.now(),
  createdAt: Date.now(),
  provider: 'password'
};

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  staffList: StaffMember[];
  customersList: UserProfile[];
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  addStaffMember: (name: string, email: string, jobTitle: string, password?: string) => Promise<void>;
  removeStaffMember: (uid: string) => Promise<void>;
  refreshCustomers: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('aura_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('aura_staff_list');
    return saved ? JSON.parse(saved) : DEFAULT_STAFF_MEMBERS;
  });
  const [customersList, setCustomersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync staff list to local storage
  useEffect(() => {
    localStorage.setItem('aura_staff_list', JSON.stringify(staffList));
  }, [staffList]);

  // Load all registered customers from Firestore
  const refreshCustomers = async () => {
    try {
      const users = await fetchUsersFromFirestore();
      setCustomersList(users);
    } catch (e) {
      console.warn('Could not load customers from Firestore:', e);
    }
  };

  useEffect(() => {
    refreshCustomers();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const cleanEmail = (fbUser.email || '').toLowerCase();
        const isAdmin = cleanEmail === 'adityapatil.4132@gmail.com';
        const staffMatch = staffList.find(s => s.email.toLowerCase() === cleanEmail);

        // Fetch user from Firestore to get existing data (phone, reservation history, etc.)
        const dbUser = await findUserByEmail(cleanEmail);

        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || dbUser?.displayName || (isAdmin ? 'Aditya Patil' : staffMatch?.displayName || fbUser.email?.split('@')[0] || 'Member'),
          phone: dbUser?.phone || null,
          role: isAdmin ? 'admin' : (staffMatch ? 'staff' : 'customer'),
          photoURL: fbUser.photoURL || dbUser?.photoURL || null,
          lastLogin: Date.now(),
          createdAt: dbUser?.createdAt || Date.now(),
          provider: fbUser.providerData[0]?.providerId || 'password',
          totalReservations: dbUser?.totalReservations || 0,
          reservationHistory: dbUser?.reservationHistory || []
        };
        setUser(profile);
        localStorage.setItem('aura_auth_user', JSON.stringify(profile));

        // Save / Sync to Firestore database
        await syncUserToFirestore(profile);
        refreshCustomers();
      } else {
        const stored = localStorage.getItem('aura_auth_user');
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [staffList]);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Master Admin Credentials
    if (cleanEmail === 'adityapatil.4132@gmail.com' && pass === '123456') {
      setUser(ADMIN_ACCOUNT);
      localStorage.setItem('aura_auth_user', JSON.stringify(ADMIN_ACCOUNT));
      await syncUserToFirestore(ADMIN_ACCOUNT);
      refreshCustomers();
      setLoading(false);
      return;
    }

    // 2. Check Staff Passwords
    const matchingStaff = staffList.find(s => s.email.toLowerCase() === cleanEmail);
    if (matchingStaff) {
      const expectedPass = matchingStaff.password || '1001';
      if (pass === expectedPass || pass === '1001') {
        const profile: UserProfile = {
          uid: matchingStaff.uid,
          email: matchingStaff.email,
          displayName: matchingStaff.displayName,
          role: 'staff',
          lastLogin: Date.now(),
          createdAt: matchingStaff.createdAt || Date.now(),
          provider: 'staff_passcode'
        };
        setUser(profile);
        localStorage.setItem('aura_auth_user', JSON.stringify(profile));
        await syncUserToFirestore(profile);
        refreshCustomers();
        setLoading(false);
        return;
      }
    }

    // 3. Online Firebase Authentication Attempt
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const isAditya = cred.user.email?.toLowerCase() === 'adityapatil.4132@gmail.com';
      const staffMember = staffList.find(s => s.email.toLowerCase() === cleanEmail);
      const dbUser = await findUserByEmail(cleanEmail);

      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || dbUser?.displayName || (isAditya ? 'Aditya Patil' : staffMember?.displayName || cleanEmail.split('@')[0]),
        phone: dbUser?.phone || null,
        role: isAditya ? 'admin' : (staffMember ? 'staff' : 'customer'),
        photoURL: cred.user.photoURL,
        lastLogin: Date.now(),
        createdAt: dbUser?.createdAt || Date.now(),
        provider: 'password',
        totalReservations: dbUser?.totalReservations || 0,
        reservationHistory: dbUser?.reservationHistory || []
      };
      setUser(profile);
      localStorage.setItem('aura_auth_user', JSON.stringify(profile));
      await syncUserToFirestore(profile);
      refreshCustomers();
      setLoading(false);
      return;
    } catch (err: any) {
      console.warn('Online Firebase auth check:', err?.code || err?.message);
    }

    // 4. Firestore Database & Local Registered Accounts fallback verification
    const dbUser = await findUserByEmail(cleanEmail);
    const localUsers: (UserProfile & { password?: string })[] = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');
    const localUser = localUsers.find(u => u.email?.toLowerCase() === cleanEmail);
    const targetUser = dbUser || localUser;

    if (targetUser) {
      if (targetUser.password && targetUser.password !== pass) {
        setLoading(false);
        throw new Error('Incorrect password. Please verify and try again.');
      }

      const profile: UserProfile = {
        uid: targetUser.uid,
        email: targetUser.email,
        displayName: targetUser.displayName || cleanEmail.split('@')[0],
        phone: targetUser.phone || null,
        role: targetUser.role || 'customer',
        photoURL: targetUser.photoURL || null,
        lastLogin: Date.now(),
        createdAt: targetUser.createdAt || Date.now(),
        provider: targetUser.provider || 'password',
        totalReservations: targetUser.totalReservations || 0,
        reservationHistory: targetUser.reservationHistory || []
      };

      setUser(profile);
      localStorage.setItem('aura_auth_user', JSON.stringify(profile));
      await syncUserToFirestore({ ...profile, password: pass });
      refreshCustomers();
      setLoading(false);
      return;
    }

    // 5. Staff universal fallback with passcode 1001
    if (pass === '1001') {
      const profile: UserProfile = {
        uid: `staff-${Date.now()}`,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        role: 'staff',
        lastLogin: Date.now(),
        createdAt: Date.now(),
        provider: 'password'
      };
      setUser(profile);
      localStorage.setItem('aura_auth_user', JSON.stringify(profile));
      await syncUserToFirestore(profile);
      refreshCustomers();
      setLoading(false);
      return;
    }

    setLoading(false);
    throw new Error('No registered account found with this email. Please click "Create Account" to register.');
  };

  const registerWithEmail = async (email: string, pass: string, name: string, phone?: string) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    const localUsers: (UserProfile & { password?: string })[] = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');
    let registeredUid = `user-${Date.now().toString(36)}`;

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      await updateProfile(cred.user, { displayName: name });
      registeredUid = cred.user.uid;
    } catch (fbErr: any) {
      console.warn('Firebase online user registration note:', fbErr.code, fbErr.message);
      if (fbErr.code === 'auth/email-already-in-use') {
        // Log in user directly with matching credentials
        setLoading(false);
        return loginWithEmail(cleanEmail, pass);
      }
    }

    const profile: UserProfile & { password?: string } = {
      uid: registeredUid,
      email: cleanEmail,
      displayName: name.trim(),
      phone: phone?.trim() || null,
      role: 'customer',
      password: pass,
      lastLogin: Date.now(),
      createdAt: Date.now(),
      provider: 'password',
      totalReservations: 0,
      reservationHistory: []
    };

    // Save to local registered accounts cache
    const updatedLocal = [profile, ...localUsers.filter(u => u.email?.toLowerCase() !== cleanEmail)];
    localStorage.setItem('aura_registered_users', JSON.stringify(updatedLocal));

    // Set active user session
    setUser(profile);
    localStorage.setItem('aura_auth_user', JSON.stringify(profile));

    // Save directly to Firestore database
    await syncUserToFirestore(profile);
    refreshCustomers();
    setLoading(false);
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const isAditya = res.user.email?.toLowerCase() === 'adityapatil.4132@gmail.com';
      const isStaff = staffList.some(s => s.email.toLowerCase() === res.user.email?.toLowerCase());
      const dbUser = await findUserByEmail(res.user.email || '');

      const profile: UserProfile = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || dbUser?.displayName || (isAditya ? 'Aditya Patil' : res.user.email?.split('@')[0] || 'Google User'),
        phone: dbUser?.phone || null,
        role: isAditya ? 'admin' : (isStaff ? 'staff' : 'customer'),
        photoURL: res.user.photoURL || dbUser?.photoURL || null,
        lastLogin: Date.now(),
        createdAt: dbUser?.createdAt || Date.now(),
        provider: 'google.com',
        totalReservations: dbUser?.totalReservations || 0,
        reservationHistory: dbUser?.reservationHistory || []
      };
      setUser(profile);
      localStorage.setItem('aura_auth_user', JSON.stringify(profile));
      await syncUserToFirestore(profile);
      refreshCustomers();
    } catch (err: any) {
      console.warn('Google sign-in error:', err?.code, err?.message);
      if (err?.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        throw new Error(
          `Domain "${currentDomain}" is not authorized in Firebase. Please add "${currentDomain}" in Firebase Console > Authentication > Settings > Authorized domains.`
        );
      } else if (err?.code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in popup was closed before completing.');
      } else if (err?.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by your browser. Please enable popups.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        throw new Error('Google sign-in was cancelled due to another active popup.');
      }
      throw new Error(err?.message || 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const addStaffMember = async (name: string, email: string, jobTitle: string, password?: string) => {
    if (user?.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can add new staff members.');
    }
    const cleanEmail = email.trim().toLowerCase();
    if (staffList.some(s => s.email.toLowerCase() === cleanEmail)) {
      throw new Error('A staff member with this email address already exists.');
    }

    const newStaff: StaffMember = {
      uid: `staff-${Date.now().toString(36)}`,
      email: cleanEmail,
      displayName: name.trim(),
      jobTitle: jobTitle.trim() || 'Barista & Operations Team',
      role: 'staff',
      password: password?.trim() || '1001',
      createdAt: Date.now(),
    };

    setStaffList(prev => [newStaff, ...prev]);

    // Sync to Firestore database
    await syncUserToFirestore({
      uid: newStaff.uid,
      email: newStaff.email,
      displayName: newStaff.displayName,
      role: 'staff',
      password: newStaff.password,
      lastLogin: Date.now(),
      createdAt: Date.now(),
      provider: 'staff_passcode'
    });
    refreshCustomers();
  };

  const removeStaffMember = async (uid: string) => {
    if (user?.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can remove staff members.');
    }
    setStaffList(prev => prev.filter(s => s.uid !== uid));
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('aura_auth_user');
    setUser(null);
    setFirebaseUser(null);
  };

  const role = user?.role || null;
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff' || role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        role,
        isAdmin,
        isStaff,
        staffList,
        customersList,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        addStaffMember,
        removeStaffMember,
        refreshCustomers,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
