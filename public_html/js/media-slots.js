export const EMPTY_MEDIA_SRC =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export const MEDIA_SLOTS = [
  {
    id: "brandLogo",
    label: "Brand Logo",
    description: "Used in the header and footer.",
    fallback: "images/brand-logo.svg",
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
    fallback: "images/hero-tractor.svg",
    defaultAlt: "BFT tractor pulling a scraper across a prepared field"
  },
  {
    id: "gpsRtk",
    label: "RTK GPS",
    description: "RTK GPS close-up image.",
    fallback: "images/gps-rtk.svg",
    defaultAlt: "RTK GPS close-up for accurate grading"
  },
  {
    id: "scraperAction",
    label: "Scraper Action",
    description: "Scraper moving soil in the field.",
    fallback: "images/scraper-action.svg",
    defaultAlt: "Scraper moving soil across the field"
  },
  {
    id: "scraperCloseup",
    label: "Scraper Close-Up",
    description: "Close-up of the ErdVark scraper.",
    fallback: "images/scraper-closeup.svg",
    defaultAlt: "Close-up of the scraper machinery"
  },
  {
    id: "tracksCloseup",
    label: "Tracks Close-Up",
    description: "Track and traction image.",
    fallback: "images/tracks-closeup.svg",
    defaultAlt: "Tracked tractor and soil detail"
  },
  {
    id: "landLevelingProcess",
    label: "Land Leveling Process",
    description: "Only used for the image band photo on the land leveling page.",
    fallback: "images/tracks-closeup.svg",
    defaultAlt: "Land leveling process image"
  },
  {
    id: "tractorTopdown",
    label: "Top-Down Tractor",
    description: "Aerial tractor and scraper image.",
    fallback: "images/tractor-topdown.svg",
    defaultAlt: "Aerial view of tractor and scraper working on a field"
  },
  {
    id: "processSurvey",
    label: "Step 1 Survey",
    description: "General survey process image used in process cards.",
    fallback: "images/process-survey.svg",
    defaultAlt: "Survey stage for landforming"
  },
  {
    id: "processDesign",
    label: "Step 2 Design",
    description: "General design process image used in process cards.",
    fallback: "images/process-design.svg",
    defaultAlt: "Create design stage for landforming"
  },
  {
    id: "processLandform",
    label: "Step 3 Landform",
    description: "General landform process image used in process cards.",
    fallback: "images/process-landform.svg",
    defaultAlt: "Landform stage with scraper in the field"
  },
  {
    id: "landformingProcessAssess",
    label: "Landforming Process: Assess",
    description: "Image shown when the Assess step is selected on the Landforming page.",
    fallback: "images/process-survey.svg",
    defaultAlt: "Assess the field before landforming"
  },
  {
    id: "landformingProcessSurvey",
    label: "Landforming Process: GPS Survey",
    description: "Image shown when the GPS Survey step is selected on the Landforming page.",
    fallback: "images/gps-rtk.svg",
    defaultAlt: "GPS survey before landforming"
  },
  {
    id: "landformingProcessDesign",
    label: "Landforming Process: Design",
    description: "Image shown when the Design step is selected on the Landforming page.",
    fallback: "images/process-design.svg",
    defaultAlt: "Landforming design process"
  },
  {
    id: "landformingProcessEarthwork",
    label: "Landforming Process: Earthmoving",
    description: "Image shown when the Earthmoving step is selected on the Landforming page.",
    fallback: "images/scraper-action.svg",
    defaultAlt: "Earthmoving during landforming"
  },
  {
    id: "landformingProcessFinal",
    label: "Landforming Process: Final Check",
    description: "Image shown when the Final Check step is selected on the Landforming page.",
    fallback: "images/process-landform.svg",
    defaultAlt: "Final landforming check"
  }
];

export const MEDIA_SLOT_MAP = MEDIA_SLOTS.reduce((map, slot) => {
  map[slot.id] = slot;
  return map;
}, {});
