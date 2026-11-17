import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "./env.js";

if (getApps().length === 0) {
  const { projectId, clientEmail, privateKey } = env.firebase;
  initializeApp({
    credential: projectId && clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault(),
  });
}

export const firebaseAuth = getAuth();
