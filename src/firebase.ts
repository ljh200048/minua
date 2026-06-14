/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Explicitly export modular SDK utilities as requested by the user
export { initializeApp, getApps, getApp } from 'firebase/app';
export { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
export { getFirestore } from 'firebase/firestore';
export { getStorage } from 'firebase/storage';

// Export configured instances and core functions from our centralized firebase module
export {
  db,
  auth,
  storage,
  isFirebaseConfigured,
  loginWithEmail,
  signUpWithEmail,
  logoutUser
} from './lib/firebase';
