import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db, isFirebaseConfigured } from "./firebase-client.js";
import { firebaseCollections, firebaseDocuments } from "./firebase-config.js";

const estimatorSection = document.querySelector("[data-landleveling-estimators]");

const currencyFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const numberFormatter = new Intl.NumberFormat("en-ZA", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const rateState = {
  zarPerHectare: 0,
  fuelPerHectare: 0
};

const formatCurrencyRate = (value) => `${currencyFormatter.format(value)} / ha`;
const formatFuelRate = (value) => `${numberFormatter.format(value)} L / ha`;
const formatFuelTotal = (value) => `${numberFormatter.format(value)} L`;

const normalizeInputValue = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
};

const syncEstimatorCard = (type) => {
  if (!estimatorSection) return;

  const hectaresInput = estimatorSection.querySelector(`[data-hectares-input="${type}"]`);
  const rateOutput = estimatorSection.querySelector(`[data-rate-output="${type}"]`);
  const totalOutput = estimatorSection.querySelector(`[data-total-output="${type}"]`);

  if (!hectaresInput || !rateOutput || !totalOutput) return;

  const hectares = normalizeInputValue(hectaresInput.value);

  if (type === "price") {
    const total = hectares * rateState.zarPerHectare;
    rateOutput.value = formatCurrencyRate(rateState.zarPerHectare);
    totalOutput.value = currencyFormatter.format(total);
    return;
  }

  const totalFuel = hectares * rateState.fuelPerHectare;
  rateOutput.value = formatFuelRate(rateState.fuelPerHectare);
  totalOutput.value = formatFuelTotal(totalFuel);
};

const syncAllEstimators = () => {
  syncEstimatorCard("price");
  syncEstimatorCard("diesel");
};

const bindEstimatorInputs = () => {
  if (!estimatorSection) return;

  estimatorSection.addEventListener("input", (event) => {
    const input = event.target.closest("[data-hectares-input]");
    if (!input) return;
    syncEstimatorCard(input.dataset.hectaresInput);
  });
};

const connectEstimatorRates = () => {
  if (!estimatorSection) return;

  syncAllEstimators();

  if (!isFirebaseConfigured || !db) {
    return;
  }

  const performanceDocRef = doc(
    db,
    firebaseCollections.siteStats,
    firebaseDocuments.performanceStatsId
  );

  onSnapshot(
    performanceDocRef,
    (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      rateState.zarPerHectare = normalizeInputValue(data?.landLevelingZarPerHectare);
      rateState.fuelPerHectare = normalizeInputValue(data?.landLevelingFuelPerHectare);
      syncAllEstimators();
    },
    (error) => {
      console.warn("Unable to load land leveling estimator rates.", error);
      rateState.zarPerHectare = 0;
      rateState.fuelPerHectare = 0;
      syncAllEstimators();
    }
  );
};

bindEstimatorInputs();
connectEstimatorRates();
