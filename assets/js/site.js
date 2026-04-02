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
