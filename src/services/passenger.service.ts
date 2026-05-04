import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  arrayUnion,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { secondaryAuth, firestore } from './firebase';
import type { Passenger } from 'src/@types/user.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const USERS_COLLECTION = 'users';
const DEFAULT_PASSWORD = 'Trocar@1234';

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreatePassengerData {
  name: string;
  email: string;
  phone: string;
  university: string;
  address: {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

// ─── Passenger Service ────────────────────────────────────────────────────────

export const passengerService = {
  /**
   * Cria uma conta de passageiro no Firebase Auth (app secundário, sem
   * deslogar o motorista) e salva os dados no Firestore.
   *
   * Fluxo:
   *  1. createUserWithEmailAndPassword no secondaryAuth
   *  2. setDoc em users/{uid} com role: 'passenger'
   *  3. arrayUnion no doc do motorista para adicionar o uid
   *  4. Desconecta a sessão do app secundário
   */
  async createPassenger(data: CreatePassengerData, driverId: string): Promise<Passenger> {
    console.log('🧑‍🎓 Criando passageiro:', {
      name: data.name,
      email: data.email,
      driverId,
    });

    try {
      // 1. Criar conta no Auth (app secundário → não afeta sessão do motorista)
      console.log('🔐 Criando usuário no Firebase Auth (secondaryAuth)...');
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        data.email,
        DEFAULT_PASSWORD,
      );

      const uid = credential.user.uid;
      console.log('✅ Firebase Auth criado. UID:', uid);

      await updateProfile(credential.user, { displayName: data.name });
      console.log('✅ Profile atualizado com displayName:', data.name);

      // 2. Salvar documento do passageiro no Firestore
      const passengerDoc: Omit<Passenger, 'createdAt' | 'updatedAt'> & {
        createdAt: ReturnType<typeof serverTimestamp>;
        updatedAt: ReturnType<typeof serverTimestamp>;
      } = {
        id: uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'passenger',
        driverId,
        routeId: '',        // Será associado quando o motorista criar rotas
        monthlyFee: 0,      // Definido pelo motorista posteriormente
        isActive: true,
        university: data.university,
        address: data.address,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('📄 Salvando passageiro no Firestore:', { uid, driverId });
      await setDoc(doc(firestore, USERS_COLLECTION, uid), passengerDoc);
      console.log('✅ Documento do passageiro salvo');

      // 3. Adicionar uid ao array passengerIds do motorista
      console.log('➕ Atualizando motorista com passengerId:', uid);
      await updateDoc(doc(firestore, USERS_COLLECTION, driverId), {
        passengerIds: arrayUnion(uid),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Motorista atualizado');

      return {
        ...passengerDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (err: any) {
      console.error('❌ Erro ao criar passageiro:', err);
      console.error('❌ Error code:', err?.code);
      console.error('❌ Error message:', err?.message);
      throw err;
    } finally {
      // 4. Desconecta a sessão do app secundário imediatamente
      try {
        await secondaryAuth.signOut();
        console.log('🔓 secondaryAuth desconectado');
      } catch (signOutErr) {
        console.warn('⚠️ Falha ao desconectar secondaryAuth:', signOutErr);
      }
    }
  },

  /**
   * Listener em tempo real: retorna todos os passageiros do motorista.
   * Permite que a lista da ManagePassengersScreen atualize automaticamente.
   */
  subscribeToPassengers(
    driverId: string,
    onData: (passengers: Passenger[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    const q = query(
      collection(firestore, USERS_COLLECTION),
      where('driverId', '==', driverId),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const passengers: Passenger[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
          } as Passenger;
        });
        onData(passengers);
      },
      (error) => {
        onError?.(error);
      },
    );
  },

  /**
   * Busca os dados de um passageiro pelo uid.
   */
  async getById(uid: string): Promise<Passenger | null> {
    const snap = await getDoc(doc(firestore, USERS_COLLECTION, uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      id: uid,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    } as Passenger;
  },

  /**
   * Ativa ou desativa um passageiro.
   */
  async setActiveStatus(passengerId: string, isActive: boolean): Promise<void> {
    await updateDoc(doc(firestore, USERS_COLLECTION, passengerId), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  },
};
