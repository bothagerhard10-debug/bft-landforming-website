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

const activeLanguage = "en";
const languageToggle = null;

document.documentElement.lang = "en";

try {
  localStorage.removeItem("bft-language");
} catch (error) {
  console.warn("Unable to clear saved language preference.", error);
}

const problemData = {
  standingWater: {
    label: "Standing water",
    afLabel: "Staande water",
    service: "Likely fit: Landforming",
    afService: "Waarskynlike pas: Landvorming",
    title: "Standing water after rain or irrigation",
    afTitle: "Staande water na reen of besproeiing",
    copy:
      "Low spots or poor fall can hold water too long. A GPS survey shows where the water is trapped and a landforming design can guide it away with less unnecessary soil movement.",
    afCopy:
      "Lae kolle of swak val kan water te lank laat staan. 'n GPS-opname wys waar die water vasle en 'n landvormingsontwerp kan dit met minder onnodige grondverskuiwing weg lei."
  },
  unevenIrrigation: {
    label: "Uneven irrigation",
    afLabel: "Oneweredige besproeiing",
    service: "Likely fit: Land leveling or landforming",
    afService: "Waarskynlike pas: Gelykmaak of landvorming",
    title: "Water spreads unevenly across the field",
    afTitle: "Water versprei oneweredig oor die land",
    copy:
      "Uneven surfaces cause water to run too fast in some places and stand in others. We first check the slope and irrigation goal, then decide whether leveling or full landforming is the better fit.",
    afCopy:
      "Oneweredige oppervlaktes laat water op party plekke te vinnig loop en op ander plekke staan. Ons kyk eers na die helling en besproeiingsdoel voor ons besluit wat pas."
  },
  dryPatches: {
    label: "Dry patches",
    afLabel: "Droee kolle",
    service: "Likely fit: GPS survey and design",
    afService: "Waarskynlike pas: GPS-opname en ontwerp",
    title: "Dry patches while other areas stay wet",
    afTitle: "Droee kolle terwyl ander areas nat bly",
    copy:
      "Dry patches often point to uneven flow, high spots, or poor water distribution. A GPS survey helps separate surface-level problems from irrigation-management problems.",
    afCopy:
      "Droee kolle wys dikwels na oneweredige vloei, hoe kolle of swak waterverspreiding. 'n GPS-opname help om oppervlakprobleme van besproeiingsbestuur te skei."
  },
  highSpots: {
    label: "High spots",
    afLabel: "Hoe kolle",
    service: "Likely fit: Land leveling",
    afService: "Waarskynlike pas: Grond gelykmaak",
    title: "High spots interrupt water movement",
    afTitle: "Hoe kolle onderbreek watervloei",
    copy:
      "High spots can block water, cause patchy crop growth, and make irrigation harder to manage. Controlled leveling can remove the worst spots without overworking the whole field.",
    afCopy:
      "Hoe kolle kan water blokkeer, ongelyke gewasgroei veroorsaak en besproeiing moeiliker maak. Beheerde gelykmaak kan die slegste kolle regstel."
  },
  erosion: {
    label: "Erosion lines",
    afLabel: "Erosielyne",
    service: "Likely fit: Landforming",
    afService: "Waarskynlike pas: Landvorming",
    title: "Water runs too hard in certain lines",
    afTitle: "Water loop te sterk in sekere bane",
    copy:
      "Erosion lines usually mean water is moving with too much speed or in the wrong direction. Landforming can soften the flow path and spread water more evenly.",
    afCopy:
      "Erosielyne beteken gewoonlik water beweeg te vinnig of in die verkeerde rigting. Landvorming kan die vloeipad versag en water beter versprei."
  },
  slowDrainage: {
    label: "Slow drainage",
    afLabel: "Stadige dreinering",
    service: "Likely fit: Landforming and drainage planning",
    afService: "Waarskynlike pas: Landvorming en dreineringsbeplanning",
    title: "The field drains slowly after water events",
    afTitle: "Die land dreineer stadig na watergebeure",
    copy:
      "Slow drainage can delay field access and damage crop consistency. We look at the natural fall first, then shape the surface so water has a planned route out.",
    afCopy:
      "Stadige dreinering kan toegang tot die land vertraag en gewas-eenheid benadeel. Ons kyk eers na die natuurlike val en vorm dan 'n beplande uitvloei."
  }
};

const problemSelector = document.querySelector("[data-problem-selector]");

if (problemSelector) {
  const buttons = problemSelector.querySelectorAll("[data-problem-key]");
  const serviceNode = problemSelector.querySelector("[data-problem-service]");
  const titleNode = problemSelector.querySelector("[data-problem-title]");
  const copyNode = problemSelector.querySelector("[data-problem-copy]");
  const linkNode = problemSelector.querySelector("[data-problem-link]");

  let currentProblemKey = "standingWater";

  const setProblem = (problemKey) => {
    currentProblemKey = problemKey;
    const problem = problemData[problemKey] || problemData.standingWater;
    buttons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.problemKey === problemKey);
    });
    if (serviceNode) serviceNode.textContent = activeLanguage === "af" ? problem.afService : problem.service;
    if (titleNode) titleNode.textContent = activeLanguage === "af" ? problem.afTitle : problem.title;
    if (copyNode) copyNode.textContent = activeLanguage === "af" ? problem.afCopy : problem.copy;
    if (linkNode) {
      const params = new URLSearchParams({ problem: problem.label });
      linkNode.href = `contact.html?${params.toString()}#quote-form`;
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => setProblem(button.dataset.problemKey));
  });

  setProblem("standingWater");

  languageToggle?.addEventListener("click", () => {
    window.requestAnimationFrame(() => setProblem(currentProblemKey));
  });
}

const savingsCalculator = document.querySelector("[data-savings-calculator]");

if (savingsCalculator) {
  const outputNodes = document.querySelectorAll("[data-savings-key]");
  const severityMap = {
    light: { water: 8, patchRate: 0.06, passRate: 0.12 },
    medium: { water: 14, patchRate: 0.11, passRate: 0.22 },
    heavy: { water: 22, patchRate: 0.18, passRate: 0.36 }
  };

  const setSavingsText = (key, value) => {
    outputNodes.forEach((node) => {
      if (node.dataset.savingsKey === key) node.textContent = value;
    });
  };

  const updateSavings = () => {
    const formData = new FormData(savingsCalculator);
    const hectares = Math.max(Number(formData.get("hectares")) || 0, 0);
    const seasonalWater = Math.max(Number(formData.get("seasonal_water")) || 0, 0);
    const severity = severityMap[String(formData.get("severity"))] || severityMap.medium;
    const problemArea = Math.max(hectares * severity.patchRate, 0);
    const repeatPasses = Math.max((seasonalWater / 25) * severity.passRate, 0);

    setSavingsText("water", `${severity.water}%`);
    setSavingsText("patches", `${problemArea.toFixed(problemArea >= 10 ? 0 : 1)}ha`);
    setSavingsText("passes", `${Math.round(repeatPasses)}`);
  };

  savingsCalculator.addEventListener("input", updateSavings);
  savingsCalculator.addEventListener("change", updateSavings);
  updateSavings();
}

const whatsappBuilder = document.querySelector("[data-whatsapp-builder]");

if (whatsappBuilder) {
  const fields = whatsappBuilder.querySelectorAll("[data-builder-field]");
  const preview = whatsappBuilder.querySelector("[data-builder-preview]");
  const link = whatsappBuilder.querySelector("[data-builder-link]");

  const readBuilderValue = (name) => {
    return whatsappBuilder.querySelector(`[data-builder-field="${name}"]`)?.value.trim() || "";
  };

  const updateBuilder = () => {
    const service = readBuilderValue("service");
    const location = readBuilderValue("location") || "my farm";
    const hectares = readBuilderValue("hectares") || "unknown hectares";
    const problem = readBuilderValue("problem");
    const message =
      activeLanguage === "af"
        ? `Goeiedag BFT Boerdery Landforming, ek het hulp nodig met ${service} naby ${location}. Die land is omtrent ${hectares} ha en die hoofprobleem is ${problem}. Kan ons 'n land assessering bespreek?`
        : `Hi BFT Boerdery Landforming, I need help with ${service} near ${location}. The field is about ${hectares} ha and the main problem is ${problem}. Can we discuss a field assessment?`;

    if (preview) preview.textContent = message;
    if (link) link.href = `https://wa.me/27840572890?text=${encodeURIComponent(message)}`;
  };

  fields.forEach((field) => {
    field.addEventListener("input", updateBuilder);
    field.addEventListener("change", updateBuilder);
  });
  languageToggle?.addEventListener("click", () => window.requestAnimationFrame(updateBuilder));
  updateBuilder();
}

const contactFormElement = document.querySelector("[data-contact-form]");
if (contactFormElement) {
  const params = new URLSearchParams(window.location.search);
  const problem = params.get("problem");
  const problemField = contactFormElement.querySelector('[name="field_problem"]');
  if (problem && problemField) {
    const match = [...problemField.options].find((option) => option.value === problem);
    if (match) problemField.value = problem;
  }
}

const processTabs = document.querySelector("[data-process-tabs]");

if (processTabs) {
  const processSteps = {
    assess: {
      kicker: "Step 1",
      title: "Assess the field",
      copy:
        "We first look at the field problem, irrigation goal, access, crop use, and where the water is currently causing trouble.",
      note: "Useful from you: field size, location pin, photos, and the main water issue.",
      mediaSlot: "landformingProcessAssess",
      image: "images/process-survey.svg",
      alt: "Survey image for landforming planning"
    },
    survey: {
      kicker: "Step 2",
      title: "GPS survey",
      copy:
        "We measure the field surface so the design is based on real levels, not guesswork. This shows high spots, low spots, and current fall.",
      note: "You get: a clearer picture of where water is trapped or moving too fast.",
      mediaSlot: "landformingProcessSurvey",
      image: "images/gps-rtk.svg",
      alt: "RTK GPS equipment for field survey"
    },
    design: {
      kicker: "Step 3",
      title: "Design water movement",
      copy:
        "The design works with the natural shape where possible and targets the cut and fill needed to improve water flow.",
      note: "Goal: move less soil while still giving the water a planned route.",
      mediaSlot: "landformingProcessDesign",
      image: "images/process-design.svg",
      alt: "Design stage using field software"
    },
    earthwork: {
      kicker: "Step 4",
      title: "Move soil with control",
      copy:
        "We follow the design with RTK guidance and controlled scraper work so the finished surface stays close to plan.",
      note: "This is where machine control and practical field output both matter.",
      mediaSlot: "landformingProcessEarthwork",
      image: "images/scraper-action.svg",
      alt: "Scraper moving soil during landforming"
    },
    finish: {
      kicker: "Step 5",
      title: "Final check",
      copy:
        "We check the finished surface against the goal: better water movement, fewer problem areas, and a field that is easier to manage.",
      note: "The result must work when the water comes, not only look good on paper.",
      mediaSlot: "landformingProcessFinal",
      image: "images/process-landform.svg",
      alt: "Finished landforming process"
    }
  };
  let currentProcessStep = "assess";
  const buttons = processTabs.querySelectorAll("[data-process-step]");
  const image = processTabs.querySelector("[data-process-image]");
  const kicker = processTabs.querySelector("[data-process-kicker]");
  const title = processTabs.querySelector("[data-process-title]");
  const copy = processTabs.querySelector("[data-process-copy]");
  const note = processTabs.querySelector("[data-process-note]");

  const setProcessStep = (stepKey) => {
    currentProcessStep = stepKey;
    const step = processSteps[stepKey] || processSteps.assess;
    const mediaAsset = window.BFT_MEDIA_SLOTS?.[step.mediaSlot];
    buttons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.processStep === stepKey);
    });
    if (image) {
      image.src = mediaAsset?.url || step.image;
      image.alt = mediaAsset?.alt || step.alt;
    }
    if (kicker) kicker.textContent = step.kicker;
    if (title) title.textContent = step.title;
    if (copy) copy.textContent = step.copy;
    if (note) note.textContent = step.note;
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => setProcessStep(button.dataset.processStep));
  });

  window.addEventListener("bft:media-slots-updated", () => {
    setProcessStep(currentProcessStep);
  });

  setProcessStep(currentProcessStep);
}

const landformingImpact = document.querySelector("[data-landforming-impact]");

if (landformingImpact) {
  const counter = landformingImpact.querySelector("[data-count-target]");
  const impactTrigger = landformingImpact.closest(".landforming-impact-section") || landformingImpact;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let hasAnimated = false;

  const animateCounter = () => {
    if (!counter || hasAnimated) return;

    hasAnimated = true;
    const target = Number(counter.dataset.countTarget || 0);
    const duration = Number(counter.dataset.countDuration || 1500);

    if (prefersReducedMotion || !Number.isFinite(target) || target <= 0) {
      counter.textContent = String(target);
      return;
    }

    const startTime = performance.now();

    const tick = (timestamp) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * easedProgress);

      counter.textContent = String(value);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
        return;
      }

      counter.textContent = String(target);
    };

    window.requestAnimationFrame(tick);
  };

  const isImpactVisible = () => {
    const rect = impactTrigger.getBoundingClientRect();
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < viewHeight * 0.88 && rect.bottom > viewHeight * 0.18;
  };

  if ("IntersectionObserver" in window) {
    const impactObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter();
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -12% 0px"
      }
    );

    impactObserver.observe(impactTrigger);
  } else {
    animateCounter();
  }

  window.addEventListener(
    "load",
    () => {
      if (isImpactVisible()) {
        animateCounter();
      }
    },
    { once: true }
  );
}
