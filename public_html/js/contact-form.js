import {
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db, isFirebaseConfigured } from "./firebase-client.js";
import { firebaseCollections } from "./firebase-config.js";

const contactForm = document.querySelector("[data-contact-form]");
const inboxEmail = "bftboerderylandforming@gmail.com";
const formSubmitEndpoint = `https://formsubmit.co/ajax/${encodeURIComponent(inboxEmail)}`;
const preferredContactOptions = new Set(["Call", "WhatsApp", "Email"]);

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
    const requiredFields = [
      "name",
      "phone",
      "email",
      "preferred_contact",
      "farm_location",
      "message"
    ];
    const hasAllFields = requiredFields.every((field) => String(formData.get(field) || "").trim());
    const preferredContact = String(formData.get("preferred_contact") || "").trim();

    return hasAllFields && preferredContactOptions.has(preferredContact);
  };

  const queueRequest = (payload) => {
    const queuedRequests = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const { files, ...queuePayload } = payload;
    queuedRequests.push({
      ...queuePayload,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(storageKey, JSON.stringify(queuedRequests));
  };

  const sendEmailNotification = async (payload) => {
    const emailFormData = new FormData();
    emailFormData.append("name", payload.name);
    emailFormData.append("phone", payload.phone);
    emailFormData.append("email", payload.email);
    emailFormData.append("preferred_contact", payload.preferredContact);
    emailFormData.append("farm_location", payload.farmLocation);
    emailFormData.append("service_type", payload.serviceType || "Not provided");
    emailFormData.append("hectares", payload.hectares || "Not provided");
    emailFormData.append("field_problem", payload.fieldProblem || "Not provided");
    emailFormData.append("message", payload.message);
    emailFormData.append("photo_names", payload.photoNames.length ? payload.photoNames.join(", ") : "No files attached");
    emailFormData.append(
      "_subject",
      `New BFT contact request from ${payload.name} (${payload.preferredContact})`
    );
    emailFormData.append("_replyto", payload.email);
    emailFormData.append("_template", "table");
    emailFormData.append("_captcha", "false");

    payload.files.forEach((file, index) => {
      emailFormData.append(`field_photo_${index + 1}`, file, file.name);
    });

    const response = await fetch(formSubmitEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json"
      },
      body: emailFormData
    });

    if (!response.ok) {
      throw new Error(`Email delivery failed with status ${response.status}`);
    }
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
      preferredContact: String(formData.get("preferred_contact")).trim(),
      farmLocation: String(formData.get("farm_location")).trim(),
      serviceType: String(formData.get("service_type") || "").trim(),
      hectares: String(formData.get("hectares") || "").trim(),
      fieldProblem: String(formData.get("field_problem") || "").trim(),
      message: String(formData.get("message")).trim(),
      files: formData
        .getAll("field_photos")
        .filter((file) => file && typeof file === "object" && file.size > 0),
      page: window.location.pathname,
      status: "new"
    };
    payload.photoNames = payload.files.map((file) => file.name);

    submitButton?.setAttribute("disabled", "disabled");
    setStatus("Sending your details...");

    let savedToFirebase = false;

    try {
      if (isFirebaseConfigured && db) {
        const { files, ...firebasePayload } = payload;
        await addDoc(collection(db, firebaseCollections.quoteRequests), {
          ...firebasePayload,
          createdAt: serverTimestamp()
        });
        savedToFirebase = true;
      }

      await sendEmailNotification(payload);

      contactForm.reset();
      localStorage.removeItem(storageKey);
      setStatus("Thanks, your details have been sent successfully. We will contact you soon.", "is-success");
    } catch (error) {
      console.error(error);

      if (savedToFirebase) {
        setStatus(
          "Your details were saved, but the email notification did not go through. Please confirm FormSubmit is activated for your Gmail inbox.",
          "is-error"
        );
      } else {
        queueRequest(payload);
        setStatus(
          "We could not send your details right now, so they have been kept on this device. Please try again shortly.",
          "is-error"
        );
      }
    } finally {
      submitButton?.removeAttribute("disabled");
    }
  });
}
