/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  query,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Detect if real Firebase credentials are provided
export function isFirebaseConfigured(): boolean {
  return (
    firebaseConfig.apiKey !== 'placeholder-api-key' &&
    !!firebaseConfig.apiKey &&
    !firebaseConfig.projectId.includes('placeholder')
  );
}

// Lazy initialization of Firebase services to survive missing/stub credentials
let app;
let dbInstance: any = null;
let authInstance: any = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    authInstance = getAuth(app);
    
    // Validate connection to Firestore as requested by raw system guidelines
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(dbInstance, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration or network.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.error('Failed to initialize real Firebase services, running in fallback mode:', err);
  }
}

export const db = dbInstance;
export const auth = authInstance;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Mandated Error Handler from Skill Rules
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: authInstance?.currentUser?.uid || null,
      email: authInstance?.currentUser?.email || null,
      emailVerified: authInstance?.currentUser?.emailVerified || null,
      isAnonymous: authInstance?.currentUser?.isAnonymous || null,
      tenantId: authInstance?.currentUser?.tenantId || null,
      providerInfo: authInstance?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Authentication Flow
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<FirebaseUser | null> {
  if (!isFirebaseConfigured()) {
    // Mock user for Local Demo mode
    const mockUser = {
      uid: 'demo_admin_uid',
      email: 'lch200048@gmail.com',
      displayName: 'Demo Manager',
      emailVerified: true,
    } as unknown as FirebaseUser;
    return mockUser;
  }
  
  try {
    const result = await signInWithPopup(authInstance, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

export async function signUpWithEmail(email: string, password: string, displayName: string, phone: string): Promise<FirebaseUser | null> {
  if (!isFirebaseConfigured() || !authInstance) {
    let localUsers: any[] = [];
    const stored = localStorage.getItem('minua_local_users');
    if (stored) {
      try {
        localUsers = JSON.parse(stored);
      } catch {
        localUsers = [];
      }
    }
    
    const existing = localUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('이미 가입된 이메일 주소입니다.');
    }
    
    const newUser = {
      uid: 'user_' + Date.now(),
      email: email,
      displayName: displayName,
      password: password,
      phone: phone
    };
    
    localUsers.push(newUser);
    localStorage.setItem('minua_local_users', JSON.stringify(localUsers));
    
    const mockUser = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName,
      emailVerified: true
    } as unknown as FirebaseUser;
    
    return mockUser;
  }

  try {
    const credential = await createUserWithEmailAndPassword(authInstance, email, password);
    if (credential.user) {
      await updateProfile(credential.user, { displayName });
      try {
        await setDoc(doc(dbInstance, 'users', credential.user.uid), {
          uid: credential.user.uid,
          email,
          displayName,
          phone,
          createdAt: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn('Could not save user profile to firestore:', dbErr);
      }
    }
    return credential.user;
  } catch (error: any) {
    console.error('Email registration failed:', error);
    let message = error.message;
    if (error.code === 'auth/email-already-in-use') {
      message = '이미 사용 중인 이메일 주소입니다.';
    } else if (error.code === 'auth/weak-password') {
      message = '비밀번호는 최소 6자리 이상이어야 합니다.';
    } else if (error.code === 'auth/invalid-email') {
      message = '유효하지 않은 이메일 형식입니다.';
    }
    throw new Error(message);
  }
}

export async function loginWithEmail(email: string, password: string): Promise<FirebaseUser | null> {
  if (!isFirebaseConfigured() || !authInstance) {
    // Support robust demonstration out-of-the-box
    let localUsers: any[] = [];
    const stored = localStorage.getItem('minua_local_users');
    if (stored) {
      try {
        localUsers = JSON.parse(stored);
      } catch {
        localUsers = [];
      }
    }
    
    const userMatch = localUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (userMatch) {
      if (userMatch.password === password) {
        const mockUser = {
          uid: userMatch.uid,
          email: userMatch.email,
          displayName: userMatch.displayName,
          emailVerified: true
        } as unknown as FirebaseUser;
        return mockUser;
      } else {
        throw new Error('틀린 비밀번호이거나 올바르지 않은 사용자 인증 정보입니다.');
      }
    }

    if (email === 'lch200048@gmail.com') {
      if (password.length >= 6) {
        const mockUser = {
          uid: 'demo_admin_uid',
          email: 'lch200048@gmail.com',
          displayName: 'Demo Manager (Email/Password)',
          emailVerified: true,
        } as unknown as FirebaseUser;
        return mockUser;
      } else {
        throw new Error('비밀번호는 최소 6자리 이상이어야 합니다.');
      }
    } else {
      throw new Error('등록되지 않은 사용자 이메일입니다. 회원가입을 먼저 진행하시거나 이메일을 확인해주십시오.');
    }
  }

  try {
    const credential = await signInWithEmailAndPassword(authInstance, email, password);
    return credential.user;
  } catch (error: any) {
    console.error('Email password Sign-In failed:', error);
    // User-friendly error translator
    let message = error.message;
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = '틀린 비밀번호이거나 올바르지 않은 사용자 인증 정보입니다.';
    } else if (error.code === 'auth/user-not-found') {
      message = '해당 이메일로 가입된 사용자를 찾을 수 없습니다.';
    } else if (error.code === 'auth/invalid-email') {
      message = '유효하지 않은 이메일 형식입니다.';
    }
    throw new Error(message);
  }
}

export async function logoutUser(): Promise<void> {
  if (!isFirebaseConfigured()) {
    return;
  }
  await signOut(authInstance);
}

// -----------------------------------------------------
// Products Database Persistence Layer (Firestore / Fallback)
// -----------------------------------------------------
import { Product } from '../types';

let localProductsCache: Product[] | null = null;

// Initialize products from local storage if in demo mode
function getLocalProducts(initialList: Product[]): Product[] {
  if (!localProductsCache) {
    const stored = localStorage.getItem('minua_firestore_fallback_products');
    if (stored) {
      try {
        localProductsCache = JSON.parse(stored);
      } catch {
        localProductsCache = [...initialList];
      }
    } else {
      localProductsCache = [...initialList];
    }
  }
  return localProductsCache || initialList;
}

function saveLocalProducts(products: Product[]) {
  localProductsCache = products;
  localStorage.setItem('minua_firestore_fallback_products', JSON.stringify(products));
}

/**
 * Fetch all products either from Firestore or fallback local state.
 * If Firestore is empty, we automatically seed it with INITIAL_PRODUCTS.
 */
export async function fetchProducts(initialList: Product[]): Promise<Product[]> {
  const collectionPath = 'products';
  
  if (!isFirebaseConfigured() || !dbInstance) {
    return getLocalProducts(initialList);
  }
  
  try {
    const colRef = collection(dbInstance, collectionPath);
    const q = query(colRef);
    const sn = await getDocs(q);
    
    if (sn.empty) {
      // Seed initial data to cloud firestore synchronously
      console.log('Firestore products collection is empty. Seeding defaults...');
      const seedPromises = initialList.map(item => {
        return setDoc(doc(dbInstance, collectionPath, item.id), item);
      });
      await Promise.all(seedPromises);
      return initialList;
    }
    
    const list: Product[] = [];
    sn.forEach(docSnap => {
      const data = docSnap.data();
      list.push({
        id: data.id,
        nameKO: data.nameKO || '',
        nameEN: data.nameEN || '',
        price: Number(data.price) || 0,
        category: data.category || 'ring',
        descriptionKO: data.descriptionKO || '',
        descriptionEN: data.descriptionEN || '',
        defaultImage: data.defaultImage || '',
        materialKO: data.materialKO || '',
        materialEN: data.materialEN || '',
        options: data.options || {}
      } as Product);
    });
    return list;
  } catch (err) {
    console.warn('Firestore products fetch error, resolving standard local fallback:', err);
    // Handle error per rules requirement
    try {
      handleFirestoreError(err, OperationType.LIST, collectionPath);
    } catch {
      // Return cached/local fallback state to maintain visual availability
    }
    return getLocalProducts(initialList);
  }
}

/**
 * Save or update product data in Firestore (or fallback storage)
 */
export async function saveProductInDb(product: Product, initialList: Product[]): Promise<void> {
  const docPath = `products/${product.id}`;
  
  if (!isFirebaseConfigured() || !dbInstance) {
    const list = getLocalProducts(initialList);
    const idx = list.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      list[idx] = product;
    } else {
      list.push(product);
    }
    saveLocalProducts(list);
    return;
  }
  
  try {
    const docRef = doc(dbInstance, 'products', product.id);
    await setDoc(docRef, {
      ...product,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

/**
 * Create a brand-new product
 */
export async function createProductInDb(product: Product, initialList: Product[]): Promise<void> {
  const docPath = `products/${product.id}`;
  
  if (!isFirebaseConfigured() || !dbInstance) {
    const list = getLocalProducts(initialList);
    list.push(product);
    saveLocalProducts(list);
    return;
  }
  
  try {
    const docRef = doc(dbInstance, 'products', product.id);
    await setDoc(docRef, {
      ...product,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, docPath);
  }
}

/**
 * Delete a product
 */
export async function deleteProductInDb(productId: string, initialList: Product[]): Promise<void> {
  const docPath = `products/${productId}`;
  
  if (!isFirebaseConfigured() || !dbInstance) {
    const list = getLocalProducts(initialList);
    const updated = list.filter(p => p.id !== productId);
    saveLocalProducts(updated);
    return;
  }
  
  try {
    const docRef = doc(dbInstance, 'products', productId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

