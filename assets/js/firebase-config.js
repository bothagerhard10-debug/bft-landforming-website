export const firebaseConfig = {
  apiKey: "REPLACE_WITH_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_FIREBASE_PROJECT_ID",
  storageBucket: "REPLACE_WITH_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_FIREBASE_APP_ID"
};

export const firebaseCollections = {
  admins: "admins",
  siteContent: "siteContent",
  quoteRequests: "quoteRequests"
};

export const firebaseDocuments = {
  siteContentId: "current"
};

export const firebaseLimits = {
  maxUploadSizeMb: 10
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => {
  return typeof value === "string" && value.trim() && !value.includes("REPLACE_WITH_FIREBASE");
});
