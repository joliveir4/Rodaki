import { useEffect, useCallback } from 'react';
import { useTripStore } from '@store/trip.store';
import { useAuthStore, selectAsDriver, selectAsPassenger } from '@store/auth.store';
import { tripService } from '@services/trip.service';
import { getTodayISO } from '@utils/formatters';

// ─── usePassengers ────────────────────────────────────────────────────────────
// Hook compartilhado — comportamento varia por role do usuário

export const usePassengers = () => {
  const {
    todayPresences,
    selectedDate,
    isLoading,
    error,
    setTodayPresences,
    updatePresence,
    setLoading,
    setError,
  } = useTripStore();

  const user = useAuthStore((s) => s.user);
  const driver = useAuthStore(selectAsDriver);
  const passenger = useAuthStore(selectAsPassenger);

  // ─── Motorista: listener em tempo real das presenças do dia ──────────────

  useEffect(() => {
    if (!driver) return;

    const unsubscribe = tripService.subscribeToDayPresences(
      driver.id,
      selectedDate,
      (presences) => {
        setTodayPresences(presences);
      },
    );

    return unsubscribe;
  }, [driver?.id, selectedDate]);

  // ─── Passageiro: busca presença do dia atual ──────────────────────────────

  const fetchMyPresence = useCallback(async () => {
    if (!passenger) return;

    try {
      setLoading(true);
      const presence = await tripService.getPresence(passenger.id, getTodayISO());
      if (presence) {
        setTodayPresences([presence]);
      } else {
        setTodayPresences([]);
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar presença');
    } finally {
      setLoading(false);
    }
  }, [passenger?.id]);

  // ─── Passageiro: confirmar / cancelar ─────────────────────────────────────

  const confirmPresence = useCallback(async () => {
    if (!passenger) return;

    try {
      setLoading(true);
      await tripService.confirmPresence(
        passenger.id,
        passenger.name,
        passenger.driverId,
      );
    } catch (err: any) {
      setError(err.message ?? 'Erro ao confirmar presença');
    } finally {
      setLoading(false);
    }
  }, [passenger]);

  const markAbsent = useCallback(async () => {
    if (!passenger) return;

    try {
      setLoading(true);
      await tripService.markAbsent(
        passenger.id,
        passenger.name,
        passenger.driverId,
      );
    } catch (err: any) {
      setError(err.message ?? 'Erro ao marcar ausência');
    } finally {
      setLoading(false);
    }
  }, [passenger]);

  // ─── Computed ─────────────────────────────────────────────────────────────

  const confirmedCount = todayPresences.filter((p) => p.status === 'confirmed').length;
  const absentCount = todayPresences.filter((p) => p.status === 'absent').length;
  const pendingCount = todayPresences.filter((p) => p.status === 'pending').length;

  const myPresence = passenger
    ? todayPresences.find((p) => p.passengerId === passenger.id) ?? null
    : null;

  return {
    todayPresences,
    myPresence,
    confirmedCount,
    absentCount,
    pendingCount,
    selectedDate,
    isLoading,
    error,
    fetchMyPresence,
    confirmPresence,
    markAbsent,
  };
};
