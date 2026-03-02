// ─── Auth Stack ───────────────────────────────────────────────────────────────

export const AUTH_ROUTES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
} as const;

// ─── Passenger Tabs ───────────────────────────────────────────────────────────

export const PASSENGER_ROUTES = {
  HOME: 'PassengerHome',
  PAYMENT: 'Payment',
  NOTIFICATIONS: 'Notifications',
} as const;

export const PASSENGER_STACK_ROUTES = {
  TABS: 'PassengerTabs',
  SCHEDULE: 'PassengerSchedule',
  UPLOAD_RECEIPT: 'PassengerUploadReceipt',
  EDIT_PROFILE: 'PassengerEditProfile',
} as const;

// ─── Driver Tabs ──────────────────────────────────────────────────────────────

export const DRIVER_ROUTES = {
  HOME: 'DriverHome',
  PASSENGER_LIST: 'PassengerList',
  PAYMENT_REVIEW: 'PaymentReview',
  MANAGE_PASSENGERS: 'ManagePassengers',
  PROFILE: 'DriverProfile',
} as const;

// ─── Driver Stack (screens sobre as tabs) ────────────────────────────────────

export const DRIVER_STACK_ROUTES = {
  TABS: 'DriverTabs',
  ADD_PASSENGER: 'AddPassenger',
  EDIT_PASSENGER: 'EditPassenger',
} as const;
