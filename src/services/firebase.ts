import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ─── Firebase Configuration ───────────────────────────────────────────────────
// ⚠️  Substitua pelos valores do seu projeto no Firebase Console
//     https://console.firebase.google.com → Configurações do projeto → Seus apps

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

// ─── Singleton Initialization ─────────────────────────────────────────────────
// Evita re-inicialização em hot reload

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// ─── App Secundário ───────────────────────────────────────────────────────────
// Usado para criar usuários no Auth sem deslogar o motorista atual.
// createUserWithEmailAndPassword invalida a sessão do app principal,
// por isso usamos uma instância separada que não está vinculada à sessão ativa.

const SECONDARY_APP_NAME = 'secondary';
const secondaryApp: FirebaseApp =
  getApps().find((a) => a.name === SECONDARY_APP_NAME) ??
  initializeApp(firebaseConfig, SECONDARY_APP_NAME);

// ─── Exports ──────────────────────────────────────────────────────────────────

export const firebaseAuth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
export const firestore = getFirestore(app);
export const firebaseStorage = getStorage(app);

export default app;
