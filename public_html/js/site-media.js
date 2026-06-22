import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db, isFirebaseConfigured } from "./firebase-client.js";
import { firebaseCollections, firebaseDocuments } from "./firebase-config.js";
import { EMPTY_MEDIA_SRC, MEDIA_SLOT_MAP } from "./media-slots.js?v=20260403f";

const mediaCacheKey = "bft-site-media-cache-v1";

const publishMediaSlots = (mediaSlots) => {
  window.BFT_MEDIA_SLOTS = mediaSlots || {};
  window.dispatchEvent(
    new CustomEvent("bft:media-slots-updated", {
      detail: {
        mediaSlots: window.BFT_MEDIA_SLOTS
      }
    })
  );
};

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

const getFallbackAsset = (slotId) => {
  const slot = MEDIA_SLOT_MAP[slotId];
  return {
    url: slot?.fallback || EMPTY_MEDIA_SRC,
    alt: slot?.defaultAlt || ""
  };
};

const readCachedMediaSlots = () => {
  try {
    return JSON.parse(localStorage.getItem(mediaCacheKey) || "{}");
  } catch (error) {
    console.warn("Unable to read cached media slots.", error);
    return {};
  }
};

const cacheMediaSlots = (mediaSlots) => {
  try {
    localStorage.setItem(mediaCacheKey, JSON.stringify(mediaSlots));
  } catch (error) {
    console.warn("Unable to cache media slots.", error);
  }
};

const applyMediaSlots = (mediaSlots) => {
  Object.entries(mediaSlots || {}).forEach(([slotId, asset]) => {
    applyMediaSlot(slotId, asset);
  });
};

const applySlotAliases = (mediaSlots) => {
  if (!mediaSlots?.landLevelingProcess && mediaSlots?.tracksCloseup) {
    applyMediaSlot("landLevelingProcess", mediaSlots.tracksCloseup);
  }
};

const clearMediaSlots = () => {
  document.querySelectorAll("[data-media-slot]").forEach((node) => {
    const slotId = node.getAttribute("data-media-slot");
    const fallbackAsset = getFallbackAsset(slotId);

    if (node.tagName === "IMG") {
      node.src = fallbackAsset.url;
      node.alt = fallbackAsset.alt || node.alt || "";
    }
  });

  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) favicon.href = getFallbackAsset("faviconLogo").url;
};

const loadMediaSlots = async () => {
  clearMediaSlots();
  const cachedMediaSlots = readCachedMediaSlots();
  applyMediaSlots(cachedMediaSlots);
  applySlotAliases(cachedMediaSlots);
  publishMediaSlots(cachedMediaSlots);

  if (!isFirebaseConfigured || !db) return;

  try {
    const snapshot = await getDoc(
      doc(db, firebaseCollections.siteContent, firebaseDocuments.siteContentId)
    );

    if (!snapshot.exists()) return;

    const mediaSlots = snapshot.data()?.mediaSlots || {};
    applyMediaSlots(mediaSlots);
    applySlotAliases(mediaSlots);
    cacheMediaSlots(mediaSlots);
    publishMediaSlots(mediaSlots);
  } catch (error) {
    console.warn("Unable to load Firebase media slots.", error);
  }
};

loadMediaSlots();
