import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './firebase';
import type { DailyPresence, PresenceStatus, TripDay, WeeklyScheduleMap, WeeklySchedule } from 'src/@types/trip.types';
import { getTodayISO } from '@utils/formatters';

// ─── Collections ──────────────────────────────────────────────────────────────

const PRESENCES_COLLECTION = 'presences';
const TRIP_DAYS_COLLECTION = 'tripDays';
const WEEKLY_SCHEDULES_COLLECTION = 'weeklySchedules';

// ─── Trip Service ─────────────────────────────────────────────────────────────

export const tripService = {
  /**
   * Busca presenças do dia para um motorista (listener em tempo real)
   */
  subscribeToDayPresences(
    driverId: string,
    date: string,
    callback: (presences: DailyPresence[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    const q = query(
      collection(firestore, PRESENCES_COLLECTION),
      where('driverId', '==', driverId),
      where('date', '==', date),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const presences = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as DailyPresence[];
        callback(presences);
      },
      (error) => {
        onError?.(error);
      },
    );
  },

  /**
   * Passageiro confirma presença
   */
  async confirmPresence(
    passengerId: string,
    passengerName: string,
    driverId: string,
    checkIn: DailyPresence['checkIn'],
    date: string = getTodayISO(),
  ): Promise<void> {
    const presenceId = `${passengerId}_${date}`;
    const docRef = doc(firestore, PRESENCES_COLLECTION, presenceId);

    await setDoc(docRef, {
      id: presenceId,
      passengerId,
      passengerName,
      driverId,
      date,
      status: 'confirmed' as PresenceStatus,
      checkIn,
      confirmedAt: serverTimestamp(),
    });
  },

  /**
   * Passageiro marca ausência
   */
  async markAbsent(
    passengerId: string,
    passengerName: string,
    driverId: string,
    date: string = getTodayISO(),
  ): Promise<void> {
    const presenceId = `${passengerId}_${date}`;
    const docRef = doc(firestore, PRESENCES_COLLECTION, presenceId);

    await setDoc(docRef, {
      id: presenceId,
      passengerId,
      passengerName,
      driverId,
      date,
      status: 'absent' as PresenceStatus,
      checkIn: 'absent',
    });
  },

  /**
   * Busca presença de um passageiro em uma data
   */
  async getPresence(passengerId: string, date: string): Promise<DailyPresence | null> {
    const presenceId = `${passengerId}_${date}`;
    const docRef = doc(firestore, PRESENCES_COLLECTION, presenceId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    return { ...docSnap.data(), id: docSnap.id } as DailyPresence;
  },

  // ─── Weekly Schedule ────────────────────────────────────────────────────────

  /**
   * Busca a agenda semanal pré-configurada de um passageiro
   */
  async getWeeklySchedule(passengerId: string): Promise<WeeklySchedule | null> {
    const docRef = doc(firestore, WEEKLY_SCHEDULES_COLLECTION, passengerId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    } as WeeklySchedule;
  },

  /**
   * Salva (ou sobrescreve) a agenda semanal de um passageiro
   */
  async saveWeeklySchedule(
    passengerId: string,
    driverId: string,
    schedule: WeeklyScheduleMap,
  ): Promise<void> {
    const docRef = doc(firestore, WEEKLY_SCHEDULES_COLLECTION, passengerId);
    await setDoc(docRef, {
      passengerId,
      driverId,
      schedule,
      updatedAt: serverTimestamp(),
    });
  },
};
