import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
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
    console.log('📝 Iniciando registro para:', data.email);

    try {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        data.email,
        data.password,
      );
      console.log('✅ Usuário criado no Firebase Auth. UID:', credential.user.uid);

      await updateProfile(credential.user, { displayName: data.name });
      console.log('✅ Profile atualizado com displayName:', data.name);

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

      console.log('📄 Tentando salvar documento no Firestore:', userData);
      await setDoc(doc(firestore, USERS_COLLECTION, credential.user.uid), userData);
      console.log('✅ Documento salvo com sucesso no Firestore');

      return {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('❌ Erro durante o registro:', error);
      throw error;
    }
  },

  /**
   * Login com e-mail e senha, retorna dados do usuário do Firestore
   */
  async login(credentials: AuthCredentials): Promise<User> {
    console.log('🔐 Tentando login com:', credentials.email);
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      credentials.email,
      credentials.password,
    );
    console.log('✅ Login Firebase Auth bem-sucedido. UID:', credential.user.uid);

    const userData = await authService.fetchUserData(credential.user.uid);
    console.log('✅ Dados do usuário recuperados:', userData);
    return userData;
  },

  /**
   * Busca dados completos do usuário no Firestore
   */
  async fetchUserData(uid: string): Promise<User> {
    console.log('📄 Buscando dados do Firestore para UID:', uid);
    const docRef = doc(firestore, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error('❌ Documento não encontrado no Firestore para UID:', uid);
      throw new Error('Usuário não encontrado');
    }

    console.log('✅ Documento encontrado:', docSnap.data());
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
   * Envia e-mail de reset de senha
   */
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(firebaseAuth, email);
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
