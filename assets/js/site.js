const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const header = document.querySelector(".site-header");
const currentPage = document.body.dataset.page;

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("is-open", !isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    });
  });
}

const activePaths = {
  home: "index.html",
  landforming: "landforming.html",
  landleveling: "landleveling.html",
  contact: "contact.html"
};

if (siteNav && currentPage && activePaths[currentPage]) {
  siteNav.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === activePaths[currentPage]) {
      link.classList.add("is-active");
    }
  });
}

const setHeaderState = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 16);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -32px 0px"
    }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

document.querySelectorAll("[data-current-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

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
      farm_location: String(formData.get("farm_location")).trim(),
      message: String(formData.get("message")).trim(),
      _subject: "New BFT Landforming quote request"
    };

    submitButton?.setAttribute("disabled", "disabled");
    setStatus("Sending your request...");

    try {
      const response = await fetch("https://formsubmit.co/ajax/bftboerderylandforming@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Form request failed");
      }

      const result = await response.json();
      if (!(result.success === true || result.success === "true")) {
        throw new Error("Form service returned an error");
      }

      contactForm.reset();
      setStatus("Thanks, your quote request has been sent successfully.", "is-success");
      localStorage.removeItem(storageKey);
    } catch (error) {
      const queuedRequests = JSON.parse(localStorage.getItem(storageKey) || "[]");
      queuedRequests.push({
        ...payload,
        created_at: new Date().toISOString()
      });
      localStorage.setItem(storageKey, JSON.stringify(queuedRequests));
      setStatus(
        "We could not send right now, so your request has been saved on this device. Please try again when you are online.",
        "is-error"
      );
    } finally {
      submitButton?.removeAttribute("disabled");
    }
  });
}
