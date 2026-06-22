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
import { EMPTY_MEDIA_SRC, MEDIA_SLOTS, MEDIA_SLOT_MAP } from "./media-slots.js?v=20260403f";

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
const performanceForm = document.querySelector("[data-performance-form]");
const performanceStatus = document.querySelector("[data-performance-status]");
const galleryPhotoForm = document.querySelector("[data-gallery-photo-form]");
const galleryPhotoStatus = document.querySelector("[data-gallery-photo-status]");
const galleryPhotoList = document.querySelector("[data-gallery-photo-list]");
const galleryVideoForm = document.querySelector("[data-gallery-video-form]");
const galleryVideoStatus = document.querySelector("[data-gallery-video-status]");
const galleryVideoList = document.querySelector("[data-gallery-video-list]");

const siteDocRef =
  db && doc(db, firebaseCollections.siteContent, firebaseDocuments.siteContentId);
const performanceStatsDocRef =
  db && doc(db, firebaseCollections.siteStats, firebaseDocuments.performanceStatsId);

const defaultPerformanceStats = {
  landformingHours: 0,
  hectaresCompleted: 0,
  hectaresDesigned: 0,
  zarPerHectare: 0,
  fuelPerHectare: 0,
  landLevelingZarPerHectare: 0,
  landLevelingFuelPerHectare: 0
};

const state = {
  currentUser: null,
  mediaSlots: {},
  performanceStats: { ...defaultPerformanceStats },
  galleryPhotos: [],
  galleryVideos: []
};

let unsubscribeSiteContent = null;
let unsubscribePerformanceStats = null;
let unsubscribeQuoteRequests = null;

const setMessage = (node, message, type = "") => {
  if (!node) return;
  node.textContent = message;
  node.classList.remove("is-success", "is-error");
  if (type) node.classList.add(type);
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const sanitizeFileName = (fileName) => {
  return fileName.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
};

const createItemId = (prefix) => {
  const randomPart =
    globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 10) ||
    Math.random().toString(36).slice(2, 12);

  return `${prefix}-${Date.now()}-${randomPart}`;
};

const extractYouTubeVideoId = (input) => {
  try {
    const url = new URL(String(input || "").trim());
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (hostname.endsWith("youtube.com")) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts[0] === "embed" || pathParts[0] === "shorts") {
        return pathParts[1] || null;
      }
    }
  } catch (error) {
    return null;
  }

  return null;
};

const normalizeGalleryPhotos = (items) => {
  if (!Array.isArray(items)) return [];

  return items.filter((item) => {
    return (
      item &&
      typeof item.id === "string" &&
      typeof item.url === "string" &&
      item.url &&
      typeof item.alt === "string"
    );
  });
};

const normalizeGalleryVideos = (items) => {
  if (!Array.isArray(items)) return [];

  return items.filter((item) => {
    return (
      item &&
      typeof item.id === "string" &&
      typeof item.videoId === "string" &&
      item.videoId &&
      typeof item.embedUrl === "string" &&
      item.embedUrl
    );
  });
};

const normalizeCounterValue = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
};

const normalizeRateValue = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
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
    const asset =
      state.mediaSlots[slot.id] ||
      (slot.id === "landLevelingProcess" ? state.mediaSlots.tracksCloseup : null);
    const preview = document.querySelector(`[data-slot-preview="${slot.id}"]`);
    const altInput = document.querySelector(`[data-slot-alt="${slot.id}"]`);

    if (preview) {
      preview.src = asset?.url || EMPTY_MEDIA_SRC;
      preview.alt = asset?.alt || slot.defaultAlt;
    }

    if (altInput) {
      altInput.value = asset?.alt || slot.defaultAlt;
    }
  });
};

const syncPerformanceForm = () => {
  if (!performanceForm) return;

  Object.entries(state.performanceStats).forEach(([key, value]) => {
    const input = performanceForm.elements.namedItem(key);
    if (input instanceof HTMLInputElement) {
      input.value = String(value);
    }
  });
};

const renderGalleryPhotoList = () => {
  if (!galleryPhotoList) return;

  if (!state.galleryPhotos.length) {
    galleryPhotoList.innerHTML = `
      <article class="admin-empty-state">
        <h3>No extra gallery photos yet.</h3>
        <p>Upload additional field photos here and they will appear on the homepage.</p>
      </article>
    `;
    return;
  }

  galleryPhotoList.innerHTML = state.galleryPhotos
    .map((item) => {
      return `
        <article class="admin-gallery-item">
          <div class="admin-gallery-item__preview">
            <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.alt)}" loading="lazy" />
          </div>
          <div class="admin-gallery-item__body">
            <h3>${escapeHtml(item.alt)}</h3>
            <p>${escapeHtml(item.url)}</p>
          </div>
          <div class="admin-media-card__actions">
            <button
              class="button button--ghost button--small admin-clear-button"
              type="button"
              data-delete-gallery-photo="${item.id}"
            >
              Remove Photo
            </button>
          </div>
        </article>
      `;
    })
    .join("");
};

const renderGalleryVideoList = () => {
  if (!galleryVideoList) return;

  if (!state.galleryVideos.length) {
    galleryVideoList.innerHTML = `
      <article class="admin-empty-state">
        <h3>No gallery videos yet.</h3>
        <p>Add YouTube links here and they will show in a separate video block.</p>
      </article>
    `;
    return;
  }

  galleryVideoList.innerHTML = state.galleryVideos
    .map((item) => {
      const thumbnailUrl = `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

      return `
        <article class="admin-gallery-item">
          <div class="admin-gallery-item__preview">
            <img src="${thumbnailUrl}" alt="${escapeHtml(item.title)}" loading="lazy" />
          </div>
          <div class="admin-gallery-item__body">
            <h3>${escapeHtml(item.title)}</h3>
            <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.url)}</a>
          </div>
          <div class="admin-media-card__actions">
            <button
              class="button button--ghost button--small admin-clear-button"
              type="button"
              data-delete-gallery-video="${item.id}"
            >
              Remove Video
            </button>
          </div>
        </article>
      `;
    })
    .join("");
};

const syncGalleryPanels = () => {
  renderGalleryPhotoList();
  renderGalleryVideoList();
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
    const details = error?.code ? `${error.code}: ${error.message}` : "Upload failed. Check your Firebase setup.";
    setMessage(statusNode, details, "is-error");
  }
};

const clearSlotAsset = async (slotId) => {
  const statusNode = document.querySelector(`[data-slot-status="${slotId}"]`);
  const previousAsset = state.mediaSlots[slotId];

  if (!state.currentUser || !previousAsset) {
    setMessage(statusNode, "This slot is already empty.", "is-error");
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

    setMessage(statusNode, "Slot cleared. Upload a new image when ready.", "is-success");
  } catch (error) {
    console.error(error);
    const details = error?.code ? `${error.code}: ${error.message}` : "Could not reset this slot.";
    setMessage(statusNode, details, "is-error");
  }
};

const uploadGalleryPhoto = async () => {
  if (!galleryPhotoForm || !siteDocRef || !state.currentUser) {
    setMessage(galleryPhotoStatus, "You must be signed in as an admin to upload photos.", "is-error");
    return;
  }

  const formData = new FormData(galleryPhotoForm);
  const alt = String(formData.get("alt") || "").trim();
  const file = galleryPhotoForm.elements.namedItem("photo")?.files?.[0];

  if (!alt || !file) {
    setMessage(galleryPhotoStatus, "Add a photo and descriptive alt text before uploading.", "is-error");
    return;
  }

  if (file.size > firebaseLimits.maxUploadSizeMb * 1024 * 1024) {
    setMessage(
      galleryPhotoStatus,
      `Please choose an image smaller than ${firebaseLimits.maxUploadSizeMb}MB.`,
      "is-error"
    );
    return;
  }

  setMessage(galleryPhotoStatus, "Uploading gallery photo...");

  try {
    const storagePath = `gallery/photos/${Date.now()}-${sanitizeFileName(file.name)}`;
    const uploadRef = ref(storage, storagePath);
    await uploadBytes(uploadRef, file, { contentType: file.type });
    const url = await getDownloadURL(uploadRef);

    const nextPhotos = [
      ...state.galleryPhotos,
      {
        id: createItemId("photo"),
        alt,
        url,
        storagePath,
        createdAt: new Date().toISOString(),
        updatedBy: state.currentUser.uid
      }
    ];

    await setDoc(
      siteDocRef,
      {
        galleryPhotos: nextPhotos,
        updatedAt: serverTimestamp(),
        updatedBy: state.currentUser.uid
      },
      { merge: true }
    );

    galleryPhotoForm.reset();
    setMessage(galleryPhotoStatus, "Gallery photo uploaded.", "is-success");
  } catch (error) {
    console.error(error);
    const details = error?.code
      ? `${error.code}: ${error.message}`
      : "Could not upload this gallery photo.";
    setMessage(galleryPhotoStatus, details, "is-error");
  }
};

const removeGalleryPhoto = async (photoId) => {
  const photo = state.galleryPhotos.find((item) => item.id === photoId);
  if (!photo || !siteDocRef || !state.currentUser) {
    setMessage(galleryPhotoStatus, "That gallery photo could not be found.", "is-error");
    return;
  }

  setMessage(galleryPhotoStatus, "Removing gallery photo...");

  try {
    const nextPhotos = state.galleryPhotos.filter((item) => item.id !== photoId);

    await setDoc(
      siteDocRef,
      {
        galleryPhotos: nextPhotos,
        updatedAt: serverTimestamp(),
        updatedBy: state.currentUser.uid
      },
      { merge: true }
    );

    if (photo.storagePath) {
      deleteObject(ref(storage, photo.storagePath)).catch(() => {
        // Ignore storage cleanup failures because Firestore remains the source of truth.
      });
    }

    setMessage(galleryPhotoStatus, "Gallery photo removed.", "is-success");
  } catch (error) {
    console.error(error);
    const details = error?.code
      ? `${error.code}: ${error.message}`
      : "Could not remove this gallery photo.";
    setMessage(galleryPhotoStatus, details, "is-error");
  }
};

const addGalleryVideo = async () => {
  if (!galleryVideoForm || !siteDocRef || !state.currentUser) {
    setMessage(galleryVideoStatus, "You must be signed in as an admin to add videos.", "is-error");
    return;
  }

  const formData = new FormData(galleryVideoForm);
  const title = String(formData.get("title") || "").trim();
  const rawUrl = String(formData.get("url") || "").trim();
  const videoId = extractYouTubeVideoId(rawUrl);

  if (!title || !rawUrl) {
    setMessage(galleryVideoStatus, "Add both a video title and a YouTube link.", "is-error");
    return;
  }

  if (!videoId) {
    setMessage(galleryVideoStatus, "Use a valid YouTube watch, share, shorts, or embed link.", "is-error");
    return;
  }

  if (state.galleryVideos.some((item) => item.videoId === videoId)) {
    setMessage(galleryVideoStatus, "That YouTube video is already in the gallery.", "is-error");
    return;
  }

  setMessage(galleryVideoStatus, "Saving gallery video...");

  try {
    const nextVideos = [
      ...state.galleryVideos,
      {
        id: createItemId("video"),
        title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0`,
        createdAt: new Date().toISOString(),
        updatedBy: state.currentUser.uid
      }
    ];

    await setDoc(
      siteDocRef,
      {
        galleryVideos: nextVideos,
        updatedAt: serverTimestamp(),
        updatedBy: state.currentUser.uid
      },
      { merge: true }
    );

    galleryVideoForm.reset();
    setMessage(galleryVideoStatus, "Gallery video added.", "is-success");
  } catch (error) {
    console.error(error);
    const details = error?.code
      ? `${error.code}: ${error.message}`
      : "Could not save this YouTube video.";
    setMessage(galleryVideoStatus, details, "is-error");
  }
};

const removeGalleryVideo = async (videoId) => {
  if (!siteDocRef || !state.currentUser) {
    setMessage(galleryVideoStatus, "You must be signed in as an admin to remove videos.", "is-error");
    return;
  }

  const nextVideos = state.galleryVideos.filter((item) => item.id !== videoId);
  if (nextVideos.length === state.galleryVideos.length) {
    setMessage(galleryVideoStatus, "That gallery video could not be found.", "is-error");
    return;
  }

  setMessage(galleryVideoStatus, "Removing gallery video...");

  try {
    await setDoc(
      siteDocRef,
      {
        galleryVideos: nextVideos,
        updatedAt: serverTimestamp(),
        updatedBy: state.currentUser.uid
      },
      { merge: true }
    );

    setMessage(galleryVideoStatus, "Gallery video removed.", "is-success");
  } catch (error) {
    console.error(error);
    const details = error?.code
      ? `${error.code}: ${error.message}`
      : "Could not remove this gallery video.";
    setMessage(galleryVideoStatus, details, "is-error");
  }
};

const savePerformanceStats = async () => {
  if (!performanceForm || !performanceStatsDocRef || !state.currentUser) {
    setMessage(performanceStatus, "You must be signed in as an admin to save stats.", "is-error");
    return;
  }

  const formData = new FormData(performanceForm);
  const nextStats = {
    landformingHours: normalizeCounterValue(formData.get("landformingHours")),
    hectaresCompleted: normalizeCounterValue(formData.get("hectaresCompleted")),
    hectaresDesigned: normalizeCounterValue(formData.get("hectaresDesigned")),
    zarPerHectare: normalizeRateValue(formData.get("zarPerHectare")),
    fuelPerHectare: normalizeRateValue(formData.get("fuelPerHectare")),
    landLevelingZarPerHectare: normalizeRateValue(formData.get("landLevelingZarPerHectare")),
    landLevelingFuelPerHectare: normalizeRateValue(formData.get("landLevelingFuelPerHectare"))
  };

  if (Object.values(nextStats).some((value) => value === null)) {
    setMessage(
      performanceStatus,
      "Use whole numbers for totals and non-negative values for the hectare rates.",
      "is-error"
    );
    return;
  }

  setMessage(performanceStatus, "Saving performance stats...");

  try {
    await setDoc(
      performanceStatsDocRef,
      {
        ...nextStats,
        updatedAt: serverTimestamp(),
        updatedBy: state.currentUser.uid
      },
      { merge: true }
    );

    setMessage(
      performanceStatus,
      "Homepage stats and estimator rates updated.",
      "is-success"
    );
  } catch (error) {
    console.error(error);
    const details = error?.code
      ? `${error.code}: ${error.message}`
      : "Could not save performance stats.";
    setMessage(performanceStatus, details, "is-error");
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
    const photoNames = Array.isArray(data.photoNames) && data.photoNames.length
      ? data.photoNames.join(", ")
      : "No files listed";

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
          <span>Prefers ${data.preferredContact || "No preference set"}</span>
          <span>Service: ${data.serviceType || "Not provided"}</span>
          <span>Hectares: ${data.hectares || "Not provided"}</span>
          <span>Problem: ${data.fieldProblem || "Not provided"}</span>
          <span>Files: ${photoNames}</span>
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

  performanceForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await savePerformanceStats();
  });

  galleryPhotoForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await uploadGalleryPhoto();
  });

  galleryVideoForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await addGalleryVideo();
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

  galleryPhotoList?.addEventListener("click", async (event) => {
    const removeButton = event.target.closest("[data-delete-gallery-photo]");
    if (!removeButton) return;

    await removeGalleryPhoto(removeButton.dataset.deleteGalleryPhoto);
  });

  galleryVideoList?.addEventListener("click", async (event) => {
    const removeButton = event.target.closest("[data-delete-gallery-video]");
    if (!removeButton) return;

    await removeGalleryVideo(removeButton.dataset.deleteGalleryVideo);
  });
};

const watchDashboardData = () => {
  unsubscribeSiteContent?.();
  unsubscribePerformanceStats?.();
  unsubscribeQuoteRequests?.();

  unsubscribeSiteContent = onSnapshot(
    siteDocRef,
    (snapshot) => {
      const data = snapshot.data() || {};
      state.mediaSlots = data.mediaSlots || {};
      state.galleryPhotos = normalizeGalleryPhotos(data.galleryPhotos);
      state.galleryVideos = normalizeGalleryVideos(data.galleryVideos);
      syncMediaCards();
      syncGalleryPanels();
      setMessage(dashboardStatus, "Firebase media slots connected.", "is-success");
    },
    (error) => {
      console.error(error);
      setMessage(dashboardStatus, "Unable to load site content from Firestore.", "is-error");
    }
  );

  unsubscribePerformanceStats = onSnapshot(
    performanceStatsDocRef,
    (snapshot) => {
      state.performanceStats = {
        ...defaultPerformanceStats,
        ...(snapshot.exists() ? snapshot.data() : {})
      };
      syncPerformanceForm();
    },
    (error) => {
      console.error(error);
      setMessage(performanceStatus, "Unable to load performance stats from Firestore.", "is-error");
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
syncPerformanceForm();
syncGalleryPanels();
bindDashboardEvents();

if (!isFirebaseConfigured || !auth || !db || !storage) {
  configNotice?.classList.remove("is-hidden");
  showDashboard(false);
  setMessage(
    loginStatus,
    "Add your Firebase web config in js/firebase-config.js before using the admin panel.",
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
      unsubscribePerformanceStats?.();
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
