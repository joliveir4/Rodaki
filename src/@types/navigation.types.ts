import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// ─── Passenger Tab Navigator ──────────────────────────────────────────────────

export type PassengerTabParamList = {
  PassengerHome: undefined;
  Payment: undefined;
  Notifications: undefined;
};
export type PassengerStackParamList = {
  PassengerTabs: undefined;
  PassengerSchedule: undefined;
  PassengerUploadReceipt: undefined;
  PassengerEditProfile: undefined;
};
// ─── Driver Tab Navigator ─────────────────────────────────────────────────────

export type DriverTabParamList = {
  DriverHome: undefined;
  PassengerList: undefined;
  PaymentReview: { passengerId?: string } | undefined;
  ManagePassengers: undefined;
  DriverProfile: undefined;
};

// ─── Driver Stack Navigator (envolve as tabs) ─────────────────────────────────

export type DriverStackParamList = {
  DriverTabs: undefined;
  AddPassenger: undefined;
  EditPassenger: { passengerId: string };
};

// ─── Screen Props Helpers ─────────────────────────────────────────────────────

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type PassengerScreenProps<T extends keyof PassengerTabParamList> =
  BottomTabScreenProps<PassengerTabParamList, T>;

export type PassengerStackScreenProps<T extends keyof PassengerStackParamList> =
  NativeStackScreenProps<PassengerStackParamList, T>;

export type DriverScreenProps<T extends keyof DriverTabParamList> =
  BottomTabScreenProps<DriverTabParamList, T>;

export type DriverStackScreenProps<T extends keyof DriverStackParamList> =
  NativeStackScreenProps<DriverStackParamList, T>;
