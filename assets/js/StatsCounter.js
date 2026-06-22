import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db, isFirebaseConfigured } from "./firebase-client.js";
import { firebaseCollections, firebaseDocuments } from "./firebase-config.js";

const section = document.querySelector("[data-performance-stats]");
const statNodes = section ? Array.from(section.querySelectorAll("[data-stat-key]")) : [];

const defaultStats = {
  landformingHours: 0,
  hectaresCompleted: 0,
  hectaresDesigned: 0
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canAnimateOnView = "IntersectionObserver" in window && !prefersReducedMotion;

const state = {
  hasEnteredView: !canAnimateOnView,
  values: { ...defaultStats }
};

const normalizeStatValue = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
};

const formatStatValue = (value) => {
  return `${normalizeStatValue(value).toLocaleString()}+`;
};

const setNodeValue = (node, value) => {
  const normalizedValue = normalizeStatValue(value);
  node.textContent = formatStatValue(normalizedValue);
  node.dataset.currentValue = String(normalizedValue);
};

const animateNodeValue = (node, startValue, endValue) => {
  const start = normalizeStatValue(startValue);
  const end = normalizeStatValue(endValue);

  const existingFrame = Number(node.dataset.animationFrame || 0);
  if (existingFrame) {
    cancelAnimationFrame(existingFrame);
  }

  if (prefersReducedMotion || start === end) {
    setNodeValue(node, end);
    return;
  }

  const durationMs = 1400;
  const animationStart = performance.now();

  const tick = (timestamp) => {
    const progress = Math.min((timestamp - animationStart) / durationMs, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const nextValue = Math.round(start + (end - start) * easedProgress);

    setNodeValue(node, nextValue);

    if (progress < 1) {
      node.dataset.animationFrame = String(requestAnimationFrame(tick));
      return;
    }

    node.dataset.animationFrame = "";
    setNodeValue(node, end);
  };

  node.dataset.animationFrame = String(requestAnimationFrame(tick));
};

const renderPerformanceStats = ({ fromZero = false } = {}) => {
  statNodes.forEach((node) => {
    const key = node.dataset.statKey;
    const nextValue = normalizeStatValue(state.values[key]);
    const currentValue = fromZero ? 0 : normalizeStatValue(node.dataset.currentValue);
    animateNodeValue(node, currentValue, nextValue);
  });
};

const connectPerformanceStats = () => {
  statNodes.forEach((node) => setNodeValue(node, 0));

  if (!isFirebaseConfigured || !db || !section || !statNodes.length) {
    return;
  }

  if (canAnimateOnView) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || state.hasEnteredView) return;
          state.hasEnteredView = true;
          renderPerformanceStats({ fromZero: true });
          obs.unobserve(entry.target);
        });
      },
      {
        threshold: 0.28,
        rootMargin: "0px 0px -48px 0px"
      }
    );

    observer.observe(section);
  }

  const performanceDocRef = doc(
    db,
    firebaseCollections.siteStats,
    firebaseDocuments.performanceStatsId
  );

  onSnapshot(
    performanceDocRef,
    (snapshot) => {
      state.values = {
        ...defaultStats,
        ...(snapshot.exists() ? snapshot.data() : {})
      };

      if (state.hasEnteredView) {
        renderPerformanceStats();
      }
    },
    (error) => {
      console.warn("Unable to load performance stats.", error);
      state.values = { ...defaultStats };

      if (state.hasEnteredView) {
        renderPerformanceStats();
      }
    }
  );
};

connectPerformanceStats();
