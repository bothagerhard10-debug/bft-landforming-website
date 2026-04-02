import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db, isFirebaseConfigured } from "./firebase-client.js";
import { firebaseCollections, firebaseDocuments } from "./firebase-config.js";
import { MEDIA_SLOT_MAP } from "./media-slots.js";

const applyMediaSlot = (slotId, asset) => {
  if (!asset?.url) return;

  document.querySelectorAll(`[data-media-slot="${slotId}"]`).forEach((node) => {
    if (node.tagName === "IMG") {
      node.src = asset.url;
      node.alt = asset.alt || node.alt || MEDIA_SLOT_MAP[slotId]?.defaultAlt || "";
    }
  });

  if (slotId === "faviconLogo") {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) favicon.href = asset.url;
  }
};

const loadMediaSlots = async () => {
  if (!isFirebaseConfigured || !db) return;

  try {
    const snapshot = await getDoc(
      doc(db, firebaseCollections.siteContent, firebaseDocuments.siteContentId)
    );

    if (!snapshot.exists()) return;

    const mediaSlots = snapshot.data()?.mediaSlots || {};
    Object.entries(mediaSlots).forEach(([slotId, asset]) => {
      applyMediaSlot(slotId, asset);
    });
  } catch (error) {
    console.warn("Unable to load Firebase media slots.", error);
  }
};

loadMediaSlots();
