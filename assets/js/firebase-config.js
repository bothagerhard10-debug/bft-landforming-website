export const firebaseConfig = {
  apiKey: "AIzaSyDiGdHu29wyMYhVUTf4oITNoBr-1eJ2BvM",
  authDomain: "jou-plaas-c3bd1.firebaseapp.com",
  projectId: "jou-plaas-c3bd1",
  storageBucket: "jou-plaas-c3bd1.firebasestorage.app",
  messagingSenderId: "865732875739",
  appId: "1:865732875739:web:c68d84d5d49df155c343fe",
  measurementId: "G-YG5ET77EMW"
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
