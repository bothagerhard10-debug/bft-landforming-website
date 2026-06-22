import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db, isFirebaseConfigured } from "./firebase-client.js";
import { firebaseCollections, firebaseDocuments } from "./firebase-config.js";

const extraPhotosGrid = document.querySelector("[data-gallery-extra-photos]");
const videoSection = document.querySelector("[data-gallery-video-section]");
const videoGrid = document.querySelector("[data-gallery-videos]");

const galleryCacheKey = "bft-gallery-content-cache-v1";

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
      typeof item.title === "string" &&
      typeof item.url === "string" &&
      typeof item.embedUrl === "string" &&
      item.embedUrl
    );
  });
};

const readCachedGallery = () => {
  try {
    return JSON.parse(localStorage.getItem(galleryCacheKey) || "{}");
  } catch (error) {
    console.warn("Unable to read cached gallery content.", error);
    return {};
  }
};

const cacheGallery = (galleryData) => {
  try {
    localStorage.setItem(galleryCacheKey, JSON.stringify(galleryData));
  } catch (error) {
    console.warn("Unable to cache gallery content.", error);
  }
};

const renderExtraPhotos = (photos) => {
  if (!extraPhotosGrid) return;

  const safePhotos = normalizeGalleryPhotos(photos);

  if (!safePhotos.length) {
    extraPhotosGrid.innerHTML = "";
    extraPhotosGrid.classList.add("is-hidden");
    return;
  }

  extraPhotosGrid.innerHTML = safePhotos
    .map((photo) => {
      return `
        <img
          src="${escapeHtml(photo.url)}"
          alt="${escapeHtml(photo.alt)}"
          loading="lazy"
          decoding="async"
        />
      `;
    })
    .join("");

  extraPhotosGrid.classList.remove("is-hidden");
};

const renderVideos = (videos) => {
  if (!videoSection || !videoGrid) return;

  const safeVideos = normalizeGalleryVideos(videos);

  if (!safeVideos.length) {
    videoGrid.innerHTML = "";
    videoSection.classList.add("is-hidden");
    return;
  }

  videoGrid.innerHTML = safeVideos
    .map((video) => {
      return `
        <article class="gallery-video-card">
          <iframe
            src="${escapeHtml(video.embedUrl)}"
            title="${escapeHtml(video.title)}"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
          <div class="gallery-video-card__body">
            <h4>${escapeHtml(video.title)}</h4>
            <a href="${escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer">
              Watch on YouTube
            </a>
          </div>
        </article>
      `;
    })
    .join("");

  videoSection.classList.remove("is-hidden");
};

const applyGallery = (galleryData) => {
  renderExtraPhotos(galleryData.galleryPhotos);
  renderVideos(galleryData.galleryVideos);
};

const loadGalleryContent = async () => {
  if (!extraPhotosGrid && !videoGrid) return;

  const cachedGallery = readCachedGallery();
  applyGallery(cachedGallery);

  if (!isFirebaseConfigured || !db) return;

  try {
    const snapshot = await getDoc(
      doc(db, firebaseCollections.siteContent, firebaseDocuments.siteContentId)
    );

    if (!snapshot.exists()) return;

    const nextGallery = {
      galleryPhotos: normalizeGalleryPhotos(snapshot.data()?.galleryPhotos),
      galleryVideos: normalizeGalleryVideos(snapshot.data()?.galleryVideos)
    };

    applyGallery(nextGallery);
    cacheGallery(nextGallery);
  } catch (error) {
    console.warn("Unable to load gallery content.", error);
  }
};

loadGalleryContent();
