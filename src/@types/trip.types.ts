// ─── Trip Domain Types ────────────────────────────────────────────────────────

export type PresenceStatus = 'pending' | 'confirmed' | 'absent';

/**
 * Opção de check-in diretá: qual trecho o passageiro fará hoje.
 * - 'going'     = somente Ida (manhã)
 * - 'returning' = somente Volta (tarde)
 * - 'both'      = Ida e Volta
 * - 'absent'    = Ausente
 */
export type CheckInOption = 'going' | 'returning' | 'both' | 'absent';

export interface DailyPresence {
  id: string;
  passengerId: string;
  passengerName: string;
  date: string;             // ISO date string 'YYYY-MM-DD'
  status: PresenceStatus;
  checkIn?: CheckInOption;  // Trecho confirmado
  confirmedAt?: Date;
  notes?: string;
}

export interface Route {
  id: string;
  driverId: string;
  name: string;
  description?: string;
  departureTime: string;   // 'HH:mm'
  returnTime?: string;     // 'HH:mm'
  isActive: boolean;
  passengerIds: string[];
}

export interface TripDay {
  date: string;            // 'YYYY-MM-DD'
  routeId: string;
  driverId: string;
  presences: DailyPresence[];
  confirmedCount: number;
  absentCount: number;
  pendingCount: number;
}

// ─── Weekly Schedule ──────────────────────────────────────────────────────────

/**
 * Opção de trecho pré-agendado para um dia da semana.
 * - 'going'     = somente Ida
 * - 'returning' = somente Volta
 * - 'both'      = Ida e Volta
 */
export type TripOption = 'going' | 'returning' | 'both';

export type WeekDay = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta';

export interface WeekDayConfig {
  enabled: boolean;
  option: TripOption | null;
}

export type WeeklyScheduleMap = Record<WeekDay, WeekDayConfig>;

export interface WeeklySchedule {
  passengerId: string;
  driverId: string;
  schedule: WeeklyScheduleMap;
  updatedAt?: Date;
}
