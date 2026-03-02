import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseAuth, firestore, firebaseStorage } from './firebase';
import type { User, AuthCredentials, RegisterData, Driver, PassengerAddress } from 'src/@types/user.types';

// ─── Firestore Collection ─────────────────────────────────────────────────────

const USERS_COLLECTION = 'users';

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Registra novo usuário e cria documento no Firestore
   */
  async register(data: RegisterData): Promise<User> {
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      data.email,
      data.password,
    );

    await updateProfile(credential.user, { displayName: data.name });

    const userData: Omit<User, 'createdAt' | 'updatedAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      updatedAt: ReturnType<typeof serverTimestamp>;
    } = {
      id: credential.user.uid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(firestore, USERS_COLLECTION, credential.user.uid), userData);

    return {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  /**
   * Login com e-mail e senha, retorna dados do usuário do Firestore
   */
  async login(credentials: AuthCredentials): Promise<User> {
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      credentials.email,
      credentials.password,
    );

    return authService.fetchUserData(credential.user.uid);
  },

  /**
   * Busca dados completos do usuário no Firestore
   */
  async fetchUserData(uid: string): Promise<User> {
    const docRef = doc(firestore, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Usuário não encontrado');
    }

    const data = docSnap.data();
    return {
      ...data,
      id: uid,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    } as User;
  },

  /**
   * Atualiza os dados editáveis do motorista (endereço + foto)
   */
  async updateDriverProfile(
    uid: string,
    updates: {
      address?: PassengerAddress;
      avatarUri?: string; // URI local (file://) para upload
      vehicleModel?: string;
      vehiclePlate?: string;
      pixKey?: string;
      pixKeyType?: import('../@types/user.types').PixKeyType;
      phone?: string;
    },
  ): Promise<Partial<Driver>> {
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };

    if (updates.address) {
      payload.address = updates.address;
    }

    if (updates.vehicleModel) payload.vehicleModel = updates.vehicleModel;
    if (updates.vehiclePlate) payload.vehiclePlate = updates.vehiclePlate;
    if (updates.pixKey) payload.pixKey = updates.pixKey;
    if (updates.pixKeyType) payload.pixKeyType = updates.pixKeyType;
    if (updates.phone) payload.phone = updates.phone;

    if (updates.avatarUri) {
      // Converte URI local em Blob e faz upload no Storage
      const response = await fetch(updates.avatarUri);
      const blob = await response.blob();
      const storageRef = ref(firebaseStorage, `avatars/${uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      payload.avatarUrl = downloadUrl;
      // Atualiza displayName/photo no Firebase Auth
      const fbUser = firebaseAuth.currentUser;
      if (fbUser) await updateProfile(fbUser, { photoURL: downloadUrl });
    }

    await updateDoc(doc(firestore, USERS_COLLECTION, uid), payload);

    return payload as Partial<Driver>;
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await signOut(firebaseAuth);
  },

  /**
   * Observa mudanças de estado de autenticação
   */
  onAuthStateChange(callback: (user: FirebaseUser | null) => void): Unsubscribe {
    return onAuthStateChanged(firebaseAuth, callback);
  },
};
