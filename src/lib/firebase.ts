import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';

let cachedApp: App | null = null;

function isConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_STORAGE_BUCKET
  );
}

function app(): App | null {
  if (cachedApp) return cachedApp;
  if (!isConfigured()) return null;
  const existing = getApps()[0];
  if (existing) {
    cachedApp = existing;
    return cachedApp;
  }
  // Service-account private keys typically arrive with literal "\n" escapes when
  // pasted into env vars; un-escape so the JWT signer is happy.
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  cachedApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
  return cachedApp;
}

function db(): Firestore | null {
  const a = app();
  return a ? getFirestore(a) : null;
}

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[firebase:${label}] mirror write failed`, err);
    return null;
  }
}

export async function mirrorMerchant(merchant: { id: number; [k: string]: any }) {
  const d = db();
  if (!d) return;
  await safe('merchant', () =>
    d.collection('merchants').doc(String(merchant.id)).set(
      { ...merchant, mirroredAt: new Date().toISOString() },
      { merge: true }
    )
  );
}

export async function deleteMerchantMirror(id: number) {
  const d = db();
  if (!d) return;
  await safe('merchant:delete', () => d.collection('merchants').doc(String(id)).delete());
}

export async function mirrorOffer(offer: { id: number; [k: string]: any }) {
  const d = db();
  if (!d) return;
  await safe('offer', () =>
    d.collection('offers').doc(String(offer.id)).set(
      { ...offer, mirroredAt: new Date().toISOString() },
      { merge: true }
    )
  );
}

export async function deleteOfferMirror(id: number) {
  const d = db();
  if (!d) return;
  await safe('offer:delete', () => d.collection('offers').doc(String(id)).delete());
}

export async function mirrorExtractionLog(log: { id: number; [k: string]: any }) {
  const d = db();
  if (!d) return;
  await safe('extractionLog', () =>
    d.collection('extractionLogs').doc(String(log.id)).set(
      { ...log, mirroredAt: new Date().toISOString() },
      { merge: true }
    )
  );
}

export async function uploadSourceFile(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string | null> {
  const a = app();
  if (!a) return null;
  return safe('storage:upload', async () => {
    const bucket = getStorage(a).bucket();
    const safeName = filename.replace(/[^A-Za-z0-9._-]+/g, '_');
    const path = `extractor-sources/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;
    const fileRef = bucket.file(path);
    await fileRef.save(buffer, { contentType, resumable: false });
    // Long-lived signed URL — adjust expiry if you need shorter-lived access.
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.UTC(2100, 0, 1),
    });
    return url;
  });
}
