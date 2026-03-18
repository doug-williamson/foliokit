import { InjectionToken } from '@angular/core';
import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { Auth } from 'firebase/auth';

export const FIREBASE_OPTIONS = new InjectionToken<FirebaseOptions>('FIREBASE_OPTIONS');
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');
export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE');
export const FIREBASE_STORAGE = new InjectionToken<FirebaseStorage>('FIREBASE_STORAGE');
export const FIREBASE_AUTH = new InjectionToken<Auth | null>('FIREBASE_AUTH');
