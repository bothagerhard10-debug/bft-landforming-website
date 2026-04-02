import {
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db, isFirebaseConfigured } from "./firebase-client.js";
import { firebaseCollections } from "./firebase-config.js";

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const statusNode = contactForm.querySelector("[data-form-status]");
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const storageKey = "bft-landforming-pending-requests";

  const setStatus = (message, type = "") => {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.classList.remove("is-success", "is-error");
    if (type) statusNode.classList.add(type);
  };

  const validateForm = (formData) => {
    const requiredFields = ["name", "phone", "email", "farm_location", "message"];
    return requiredFields.every((field) => String(formData.get(field) || "").trim());
  };

  const queueRequest = (payload) => {
    const queuedRequests = JSON.parse(localStorage.getItem(storageKey) || "[]");
    queuedRequests.push({
      ...payload,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(storageKey, JSON.stringify(queuedRequests));
  };

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);

    if (!validateForm(formData)) {
      setStatus("Please complete all fields before sending.", "is-error");
      return;
    }

    const payload = {
      name: String(formData.get("name")).trim(),
      phone: String(formData.get("phone")).trim(),
      email: String(formData.get("email")).trim(),
      farmLocation: String(formData.get("farm_location")).trim(),
      message: String(formData.get("message")).trim(),
      page: window.location.pathname,
      status: "new"
    };

    submitButton?.setAttribute("disabled", "disabled");
    setStatus("Sending your request...");

    if (!isFirebaseConfigured || !db) {
      queueRequest(payload);
      setStatus(
        "Firebase is not configured yet, so your request has been saved on this device for now.",
        "is-error"
      );
      submitButton?.removeAttribute("disabled");
      return;
    }

    try {
      await addDoc(collection(db, firebaseCollections.quoteRequests), {
        ...payload,
        createdAt: serverTimestamp()
      });

      contactForm.reset();
      localStorage.removeItem(storageKey);
      setStatus("Thanks, your quote request has been saved successfully.", "is-success");
    } catch (error) {
      queueRequest(payload);
      setStatus(
        "We could not save your request right now, so it has been kept on this device. Please try again shortly.",
        "is-error"
      );
    } finally {
      submitButton?.removeAttribute("disabled");
    }
  });
}
