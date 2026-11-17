import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** False until the Firebase keys are in .env.local; the app then shows setup help instead of crashing. */
export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

export function getFirebaseAuth() {
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  return getAuth(app);
}
