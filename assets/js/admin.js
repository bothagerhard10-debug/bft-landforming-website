import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  collection,
  deleteField,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";
import { auth, db, storage, isFirebaseConfigured } from "./firebase-client.js";
import {
  firebaseCollections,
  firebaseDocuments,
  firebaseLimits
} from "./firebase-config.js";
import { MEDIA_SLOTS, MEDIA_SLOT_MAP } from "./media-slots.js";

const loginPanel = document.querySelector("[data-admin-login]");
const dashboardPanel = document.querySelector("[data-admin-dashboard]");
const configNotice = document.querySelector("[data-config-notice]");
const loginForm = document.querySelector("[data-login-form]");
const loginStatus = document.querySelector("[data-login-status]");
const signOutButton = document.querySelector("[data-sign-out]");
const mediaGrid = document.querySelector("[data-media-grid]");
const quoteList = document.querySelector("[data-quote-list]");
const dashboardStatus = document.querySelector("[data-dashboard-status]");
const accountBadge = document.querySelector("[data-account-email]");

const siteDocRef =
  db && doc(db, firebaseCollections.siteContent, firebaseDocuments.siteContentId);

const state = {
  currentUser: null,
  mediaSlots: {}
};

let unsubscribeSiteContent = null;
let unsubscribeQuoteRequests = null;

const setMessage = (node, message, type = "") => {
  if (!node) return;
  node.textContent = message;
  node.classList.remove("is-success", "is-error");
  if (type) node.classList.add(type);
};

const sanitizeFileName = (fileName) => {
  return fileName.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
};

const renderMediaGrid = () => {
  if (!mediaGrid) return;

  mediaGrid.innerHTML = MEDIA_SLOTS.map((slot) => {
    return `
      <article class="admin-media-card" data-slot-card="${slot.id}">
        <div class="admin-media-card__preview">
          <img src="${slot.fallback}" alt="${slot.defaultAlt}" data-slot-preview="${slot.id}" />
        </div>
        <div class="admin-media-card__body">
          <div class="admin-media-card__heading">
            <h3>${slot.label}</h3>
            <p>${slot.description}</p>
          </div>
          <label class="admin-field">
            <span>Alt Text</span>
            <input type="text" value="${slot.defaultAlt}" data-slot-alt="${slot.id}" />
          </label>
          <label class="admin-field admin-field--file">
            <span>Image File</span>
            <input type="file" accept="image/*" data-slot-file="${slot.id}" />
          </label>
          <div class="admin-media-card__actions">
            <button class="button button--small" type="button" data-upload-slot="${slot.id}">
              Upload
            </button>
            <button
              class="button button--ghost button--small admin-clear-button"
              type="button"
              data-clear-slot="${slot.id}"
            >
              Reset
            </button>
          </div>
          <p class="admin-inline-status" data-slot-status="${slot.id}"></p>
        </div>
      </article>
    `;
  }).join("");
};

const syncMediaCards = () => {
  MEDIA_SLOTS.forEach((slot) => {
    const asset = state.mediaSlots[slot.id];
    const preview = document.querySelector(`[data-slot-preview="${slot.id}"]`);
    const altInput = document.querySelector(`[data-slot-alt="${slot.id}"]`);

    if (preview) {
      preview.src = asset?.url || slot.fallback;
      preview.alt = asset?.alt || slot.defaultAlt;
    }

    if (altInput) {
      altInput.value = asset?.alt || slot.defaultAlt;
    }
  });
};

const ensureAdminAccess = async (user) => {
  const adminDoc = await getDoc(doc(db, firebaseCollections.admins, user.uid));
  return adminDoc.exists();
};

const showDashboard = (show) => {
  loginPanel?.classList.toggle("is-hidden", show);
  dashboardPanel?.classList.toggle("is-hidden", !show);
};

const uploadSlotAsset = async (slotId) => {
  const slot = MEDIA_SLOT_MAP[slotId];
  const fileInput = document.querySelector(`[data-slot-file="${slotId}"]`);
  const altInput = document.querySelector(`[data-slot-alt="${slotId}"]`);
  const statusNode = document.querySelector(`[data-slot-status="${slotId}"]`);
  const file = fileInput?.files?.[0];

  if (!slot || !file || !state.currentUser) {
    setMessage(statusNode, "Choose an image before uploading.", "is-error");
    return;
  }

  if (file.size > firebaseLimits.maxUploadSizeMb * 1024 * 1024) {
    setMessage(
      statusNode,
      `Please choose an image smaller than ${firebaseLimits.maxUploadSizeMb}MB.`,
      "is-error"
    );
    return;
  }

  setMessage(statusNode, "Uploading image...");

  const previousAsset = state.mediaSlots[slotId];
  const storagePath = `site-assets/${slotId}/${Date.now()}-${sanitizeFileName(file.name)}`;

  try {
    const uploadRef = ref(storage, storagePath);
    await uploadBytes(uploadRef, file, {
      contentType: file.type
    });

    const url = await getDownloadURL(uploadRef);
    const alt = altInput?.value?.trim() || slot.defaultAlt;

    await setDoc(
      siteDocRef,
      {
        mediaSlots: {
          [slotId]: {
            url,
            alt,
            storagePath,
            updatedAt: serverTimestamp(),
            updatedBy: state.currentUser.uid
          }
        },
        updatedAt: serverTimestamp(),
        updatedBy: state.currentUser.uid
      },
      { merge: true }
    );

    if (previousAsset?.storagePath) {
      deleteObject(ref(storage, previousAsset.storagePath)).catch(() => {
        // Best effort cleanup for replaced files.
      });
    }

    fileInput.value = "";
    setMessage(statusNode, "Upload complete.", "is-success");
  } catch (error) {
    console.error(error);
    setMessage(statusNode, "Upload failed. Check your Firebase setup.", "is-error");
  }
};

const clearSlotAsset = async (slotId) => {
  const statusNode = document.querySelector(`[data-slot-status="${slotId}"]`);
  const previousAsset = state.mediaSlots[slotId];

  if (!state.currentUser || !previousAsset) {
    setMessage(statusNode, "This slot is already using its fallback image.", "is-error");
    return;
  }

  setMessage(statusNode, "Resetting slot...");

  try {
    await updateDoc(siteDocRef, {
      [`mediaSlots.${slotId}`]: deleteField(),
      updatedAt: serverTimestamp(),
      updatedBy: state.currentUser.uid
    });

    if (previousAsset.storagePath) {
      deleteObject(ref(storage, previousAsset.storagePath)).catch(() => {
        // Ignore delete failures because the Firestore document is the source of truth.
      });
    }

    setMessage(statusNode, "Slot reset to fallback image.", "is-success");
  } catch (error) {
    console.error(error);
    setMessage(statusNode, "Could not reset this slot.", "is-error");
  }
};

const renderQuoteRequests = (docs) => {
  if (!quoteList) return;

  if (!docs.length) {
    quoteList.innerHTML = `
      <article class="admin-empty-state">
        <h3>No quote requests yet.</h3>
        <p>New form submissions will appear here once the public contact page is live.</p>
      </article>
    `;
    return;
  }

  quoteList.innerHTML = docs.map((quoteDoc) => {
    const data = quoteDoc.data();
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
    const createdLabel = createdAt ? createdAt.toLocaleString() : "Pending timestamp";
    const status = data.status || "new";

    return `
      <article class="quote-card">
        <div class="quote-card__header">
          <div>
            <h3>${data.name || "Unnamed request"}</h3>
            <p>${createdLabel}</p>
          </div>
          <span class="quote-card__status">${status}</span>
        </div>
        <div class="quote-card__meta">
          <a href="tel:${data.phone || ""}">${data.phone || "No phone"}</a>
          <a href="mailto:${data.email || ""}">${data.email || "No email"}</a>
          <span>${data.farmLocation || "No farm location"}</span>
        </div>
        <p class="quote-card__message">${data.message || ""}</p>
        <div class="quote-card__actions">
          <button class="button button--small" type="button" data-mark-contacted="${quoteDoc.id}">
            Mark Contacted
          </button>
        </div>
      </article>
    `;
  }).join("");
};

const bindDashboardEvents = () => {
  mediaGrid?.addEventListener("click", (event) => {
    const uploadButton = event.target.closest("[data-upload-slot]");
    const clearButton = event.target.closest("[data-clear-slot]");

    if (uploadButton) {
      uploadSlotAsset(uploadButton.dataset.uploadSlot);
    }

    if (clearButton) {
      clearSlotAsset(clearButton.dataset.clearSlot);
    }
  });

  quoteList?.addEventListener("click", async (event) => {
    const contactedButton = event.target.closest("[data-mark-contacted]");
    if (!contactedButton) return;

    const requestId = contactedButton.dataset.markContacted;
    contactedButton.setAttribute("disabled", "disabled");

    try {
      await updateDoc(doc(db, firebaseCollections.quoteRequests, requestId), {
        status: "contacted",
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
    } finally {
      contactedButton.removeAttribute("disabled");
    }
  });
};

const watchDashboardData = () => {
  unsubscribeSiteContent?.();
  unsubscribeQuoteRequests?.();

  unsubscribeSiteContent = onSnapshot(
    siteDocRef,
    (snapshot) => {
      state.mediaSlots = snapshot.data()?.mediaSlots || {};
      syncMediaCards();
      setMessage(dashboardStatus, "Firebase media slots connected.", "is-success");
    },
    (error) => {
      console.error(error);
      setMessage(dashboardStatus, "Unable to load site content from Firestore.", "is-error");
    }
  );

  unsubscribeQuoteRequests = onSnapshot(
    query(
      collection(db, firebaseCollections.quoteRequests),
      orderBy("createdAt", "desc"),
      limit(50)
    ),
    (snapshot) => {
      renderQuoteRequests(snapshot.docs);
    },
    (error) => {
      console.error(error);
      quoteList.innerHTML = `
        <article class="admin-empty-state">
          <h3>Unable to load quote requests.</h3>
          <p>Check your Firestore rules and that the quoteRequests collection exists.</p>
        </article>
      `;
    }
  );
};

renderMediaGrid();
syncMediaCards();
bindDashboardEvents();

if (!isFirebaseConfigured || !auth || !db || !storage) {
  configNotice?.classList.remove("is-hidden");
  showDashboard(false);
  setMessage(
    loginStatus,
    "Add your Firebase web config in assets/js/firebase-config.js before using the admin panel.",
    "is-error"
  );
} else {
  configNotice?.classList.add("is-hidden");

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setMessage(loginStatus, "Enter your email and password to sign in.", "is-error");
      return;
    }

    setMessage(loginStatus, "Signing in...");

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
      setMessage(loginStatus, "Sign-in failed. Check your credentials and Auth setup.", "is-error");
    }
  });

  signOutButton?.addEventListener("click", async () => {
    await signOut(auth);
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      state.currentUser = null;
      unsubscribeSiteContent?.();
      unsubscribeQuoteRequests?.();
      if (accountBadge) accountBadge.textContent = "Signed out";
      showDashboard(false);
      return;
    }

    try {
      const isAdmin = await ensureAdminAccess(user);

      if (!isAdmin) {
        const uid = user.uid;
        await signOut(auth);
        setMessage(
          loginStatus,
          `This account is not registered as an admin. Create Firestore document admins/${uid} in the Firebase Console.`,
          "is-error"
        );
        return;
      }

      state.currentUser = user;
      if (accountBadge) accountBadge.textContent = user.email || user.uid;
      showDashboard(true);
      setMessage(loginStatus, "", "");
      watchDashboardData();
    } catch (error) {
      console.error(error);
      setMessage(loginStatus, "Could not validate admin access.", "is-error");
    }
  });
}
