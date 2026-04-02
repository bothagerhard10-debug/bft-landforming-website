import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, browserLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Local persistence can fail in private browsing modes; auth still works.
  });
}

export { app, auth, db, storage, isFirebaseConfigured };
