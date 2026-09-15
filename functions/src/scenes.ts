export interface Scene {
  id: string;
  name: string;
  /** Filename under functions/assets/scenes/ — a real photo used as the Gemini background reference. */
  referenceImage: string;
  /**
   * Instruction appended to the base compositing prompt. Focus on pose, PPE,
   * and how the subject relates to what's already in the reference photo —
   * identity preservation and the "single real photograph" instruction
   * already live in the base prompt.
   */
  promptDetail: string;
}

// All reference photos here are real NALCO photography scraped from the
// official homepage carousel (nalcoindia.com) — not AI-generated.
export const SCENES: Scene[] = [
  {
    id: "port-terminal",
    name: "Port Terminal",
    referenceImage: "port-terminal.jpg",
    promptDetail:
      "Place the subject standing in the foreground of this port/shipping " +
      "terminal, facing the camera with the cranes and cargo ships behind " +
      "them. Helmet and high-visibility vest. Match the hazy, overcast " +
      "daylight already in the photo.",
  },
  {
    id: "mine-access-road",
    name: "Mine Access Road",
    referenceImage: "mine-access-road.jpg",
    promptDetail:
      "Place the subject standing on this red-earth mine access road, " +
      "facing the camera with the tree line and safety signage behind " +
      "them. Helmet and high-visibility vest. Match the warm, saturated " +
      "daylight already in the photo.",
  },
  {
    id: "refinery-mountains",
    name: "Refinery View",
    referenceImage: "refinery-mountains.jpg",
    promptDetail:
      "Place the subject standing in the foreground with the refinery " +
      "and its chimneys spread out behind them against the mountains. " +
      "Helmet and high-visibility vest. Match the soft, hazy daylight " +
      "already in the photo.",
  },
  {
    id: "corporate-hq",
    name: "Corporate HQ",
    referenceImage: "corporate-hq.jpg",
    promptDetail:
      "Place the subject standing on the lawn in front of this corporate " +
      "headquarters building, facing the camera. Smart-casual attire, no " +
      "PPE needed here. Match the bright, clear daylight already in the " +
      "photo.",
  },
  {
    id: "refinery-aerial",
    name: "Refinery Aerial",
    referenceImage: "refinery-aerial.jpg",
    promptDetail:
      "Place the subject standing in the foreground with the sprawling " +
      "refinery complex and its chimneys behind them. Helmet and " +
      "high-visibility vest. Match the warm, clear daylight already in " +
      "the photo.",
  },
  {
    id: "ingot-warehouse",
    name: "Ingot Warehouse",
    referenceImage: "ingot-warehouse.jpg",
    promptDetail:
      "Place the subject standing near the stacked aluminium ingots in " +
      "this warehouse, facing the camera. Helmet and high-visibility " +
      "vest. Match the industrial indoor lighting already in the photo.",
  },
  {
    id: "power-plant",
    name: "Power Plant",
    referenceImage: "power-plant.jpg",
    promptDetail:
      "Place the subject standing in the foreground with the power " +
      "plant's tall chimneys behind them. Helmet and high-visibility " +
      "vest. Match the bright daylight and dramatic clouds already in " +
      "the photo.",
  },
  {
    id: "mining-fleet",
    name: "Mining Fleet",
    referenceImage: "mining-fleet.jpg",
    promptDetail:
      "Place the subject standing in the foreground of this open mine " +
      "site, facing the camera with the fleet of dump trucks and " +
      "excavator working behind them. Helmet and high-visibility vest. " +
      "Match the warm, red-toned daylight already in the photo.",
  },
  {
    id: "wind-farm",
    name: "Wind Farm",
    referenceImage: "wind-farm.jpg",
    promptDetail:
      "Place the subject standing in the foreground on the hillside with " +
      "the wind turbines behind them. Smart-casual attire or a light " +
      "high-visibility vest. Match the clear blue-sky daylight already " +
      "in the photo.",
  },
];

export function getScene(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}
