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

export const SCENES: Scene[] = [
  {
    id: "mine-sunset-panorama",
    name: "Mine at Sunset",
    referenceImage: "mine-sunset-panorama.jpg",
    promptDetail:
      "Place the subject standing in the foreground of this open-pit mine " +
      "at sunset, facing the camera with the terraced pit and equipment " +
      "behind them. Full PPE: helmet, high-visibility vest. Match the warm " +
      "golden-hour light and long shadows already in the photo.",
  },
  {
    id: "heavy-equipment-yard",
    name: "Heavy Equipment Yard",
    referenceImage: "heavy-equipment-yard.jpg",
    promptDetail:
      "Place the subject standing near the excavator and drill rig in this " +
      "equipment yard, one hand resting confidently on the nearby " +
      "machinery. Helmet, high-visibility vest and gloves. Match the " +
      "overcast, even daylight already in the photo.",
  },
  {
    id: "control-room",
    name: "Control Room",
    referenceImage: "control-room.jpg",
    promptDetail:
      "Place the subject standing near the control console in this plant " +
      "control room, facing the camera with the wall of monitoring screens " +
      "behind them. Smart-casual attire, no helmet needed indoors. Match " +
      "the cool blue-toned indoor lighting already in the photo.",
  },
  {
    id: "safety-station",
    name: "Safety Station",
    referenceImage: "safety-station.jpg",
    promptDetail:
      "Place the subject standing beside the safety signage and PPE rack " +
      "in this photo, wearing a helmet and high-visibility vest as if " +
      "just having geared up. Match the bright outdoor daylight already " +
      "in the photo.",
  },
  {
    id: "haul-road-dusk",
    name: "Haul Road at Dusk",
    referenceImage: "haul-road-dusk.jpg",
    promptDetail:
      "Place the subject standing in the foreground on this mine haul " +
      "road at dusk, with the dusty terraced pit and hauling trucks " +
      "behind them. Full PPE: helmet, high-visibility vest. Match the " +
      "dusty, warm dusk lighting already in the photo.",
  },
  {
    id: "mining-convoy",
    name: "Mining Convoy",
    referenceImage: "mining-convoy.jpg",
    promptDetail:
      "Place the subject standing in the foreground with the convoy of " +
      "mining trucks working the terraced roads behind them. Full PPE: " +
      "helmet, high-visibility vest. Match the dusty, warm evening " +
      "lighting already in the photo.",
  },
  {
    id: "smelter-floor",
    name: "Smelter Floor",
    referenceImage: "smelter-floor.jpg",
    promptDetail:
      "Place the subject standing in the aisle of this smelter hall, " +
      "facing the camera with the glowing furnace troughs on either side. " +
      "Full PPE: helmet, high-visibility vest, safety glasses. Match the " +
      "warm industrial lighting and glow already in the photo.",
  },
  {
    id: "refinery-control-center",
    name: "Refinery Control Center",
    referenceImage: "refinery-control-center.jpg",
    promptDetail:
      "Place the subject standing near the console in this refinery " +
      "control center, facing the camera with the curved wall of process " +
      "screens behind them. Smart-casual attire, no helmet needed indoors. " +
      "Match the cool blue-toned indoor lighting already in the photo.",
  },
  {
    id: "bauxite-mine-gate",
    name: "Bauxite Mine Gate",
    referenceImage: "bauxite-mine-gate.jpg",
    promptDetail:
      "Place the subject standing in the foreground of this open-pit " +
      "bauxite mine, with the site entrance signage and terraced pit " +
      "behind them. Full PPE: helmet, high-visibility vest. Match the " +
      "warm sunset lighting already in the photo.",
  },
  {
    id: "safety-briefing-yard",
    name: "Safety Briefing Yard",
    referenceImage: "safety-briefing-yard.jpg",
    promptDetail:
      "Place the subject standing near the safety hazard board and " +
      "benches in this briefing yard, as if part of a toolbox talk. " +
      "Helmet and high-visibility vest. Match the bright daylight already " +
      "in the photo.",
  },
  {
    id: "tools-and-gear",
    name: "Tools & Gear",
    referenceImage: "tools-and-gear.jpg",
    promptDetail:
      "Place the subject standing among the mining tools and equipment " +
      "crates in this photo, one hand resting on the nearby gear. Helmet " +
      "and high-visibility vest. Match the clean, neutral studio-style " +
      "lighting already in the photo.",
  },
  {
    id: "damanjodi-aerial",
    name: "Damanjodi Aerial View",
    referenceImage: "damanjodi-aerial.jpg",
    promptDetail:
      "Place the subject standing in the foreground with the vast open " +
      "mine and refinery stretching out behind them to the horizon. Full " +
      "PPE: helmet, high-visibility vest. Match the dramatic dusk lighting " +
      "already in the photo.",
  },
  {
    id: "pot-line-hall",
    name: "Pot Line Hall",
    referenceImage: "pot-line-hall.jpg",
    promptDetail:
      "Place the subject standing in the aisle of this aluminium pot line " +
      "hall, facing the camera with the rows of machinery and safety " +
      "signage behind them. Full PPE: helmet, high-visibility vest, " +
      "safety glasses. Match the warm industrial lighting already in the " +
      "photo.",
  },
];

export function getScene(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}
