export const MEDIA_SLOTS = [
  {
    id: "brandLogo",
    label: "Brand Logo",
    description: "Used in the header and footer.",
    fallback: "assets/images/brand-logo.svg",
    defaultAlt: "BFT Landforming logo"
  },
  {
    id: "faviconLogo",
    label: "Favicon",
    description: "Browser tab icon.",
    fallback: "favicon.svg",
    defaultAlt: "BFT favicon"
  },
  {
    id: "homeHero",
    label: "Home Hero",
    description: "Main tractor with scraper hero image.",
    fallback: "assets/images/hero-tractor.svg",
    defaultAlt: "BFT tractor pulling a scraper across a prepared field"
  },
  {
    id: "gpsRtk",
    label: "RTK GPS",
    description: "RTK GPS close-up image.",
    fallback: "assets/images/gps-rtk.svg",
    defaultAlt: "RTK GPS close-up for accurate grading"
  },
  {
    id: "scraperAction",
    label: "Scraper Action",
    description: "Scraper moving soil in the field.",
    fallback: "assets/images/scraper-action.svg",
    defaultAlt: "Scraper moving soil across the field"
  },
  {
    id: "scraperCloseup",
    label: "Scraper Close-Up",
    description: "Close-up of the ErdVark scraper.",
    fallback: "assets/images/scraper-closeup.svg",
    defaultAlt: "Close-up of the scraper machinery"
  },
  {
    id: "tracksCloseup",
    label: "Tracks Close-Up",
    description: "Track and traction image.",
    fallback: "assets/images/tracks-closeup.svg",
    defaultAlt: "Tracked tractor and soil detail"
  },
  {
    id: "tractorTopdown",
    label: "Top-Down Tractor",
    description: "Aerial tractor and scraper image.",
    fallback: "assets/images/tractor-topdown.svg",
    defaultAlt: "Aerial view of tractor and scraper working on a field"
  },
  {
    id: "processSurvey",
    label: "Step 1 Survey",
    description: "Survey process image.",
    fallback: "assets/images/process-survey.svg",
    defaultAlt: "Survey stage for landforming"
  },
  {
    id: "processDesign",
    label: "Step 2 Design",
    description: "Design process image.",
    fallback: "assets/images/process-design.svg",
    defaultAlt: "Create design stage for landforming"
  },
  {
    id: "processLandform",
    label: "Step 3 Landform",
    description: "Landform process image.",
    fallback: "assets/images/process-landform.svg",
    defaultAlt: "Landform stage with scraper in the field"
  }
];

export const MEDIA_SLOT_MAP = MEDIA_SLOTS.reduce((map, slot) => {
  map[slot.id] = slot;
  return map;
}, {});
