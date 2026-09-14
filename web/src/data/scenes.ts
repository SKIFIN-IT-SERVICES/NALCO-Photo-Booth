export interface SceneOption {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
}

// IDs here must match functions/src/scenes.ts exactly — the id is what
// gets sent to the backend to pick the compositing prompt + reference photo.
export const SCENES: SceneOption[] = [
  {
    id: "mine-sunset-panorama",
    name: "Mine at Sunset",
    description: "Wide open-pit view, golden evening light",
    thumbnail: "/scenes/mine-sunset-panorama.jpg",
  },
  {
    id: "heavy-equipment-yard",
    name: "Heavy Equipment Yard",
    description: "Beside the drill rig and excavator",
    thumbnail: "/scenes/heavy-equipment-yard.jpg",
  },
  {
    id: "control-room",
    name: "Control Room",
    description: "At the plant's live monitoring station",
    thumbnail: "/scenes/control-room.jpg",
  },
  {
    id: "safety-station",
    name: "Safety Station",
    description: "Suited up at the safety gear point",
    thumbnail: "/scenes/safety-station.jpg",
  },
  {
    id: "haul-road-dusk",
    name: "Haul Road at Dusk",
    description: "On the mine's dusty haul road",
    thumbnail: "/scenes/haul-road-dusk.jpg",
  },
  {
    id: "mining-convoy",
    name: "Mining Convoy",
    description: "Among the trucks working the terraces",
    thumbnail: "/scenes/mining-convoy.jpg",
  },
  {
    id: "smelter-floor",
    name: "Smelter Floor",
    description: "Inside the aluminium smelter hall",
    thumbnail: "/scenes/smelter-floor.jpg",
  },
  {
    id: "refinery-control-center",
    name: "Refinery Control Center",
    description: "Center of the aluminium refinery's operations",
    thumbnail: "/scenes/refinery-control-center.jpg",
  },
  {
    id: "bauxite-mine-gate",
    name: "Bauxite Mine Gate",
    description: "At the entrance to the bauxite mine",
    thumbnail: "/scenes/bauxite-mine-gate.jpg",
  },
  {
    id: "safety-briefing-yard",
    name: "Safety Briefing Yard",
    description: "At the toolbox-talk & PPE point",
    thumbnail: "/scenes/safety-briefing-yard.jpg",
  },
  {
    id: "tools-and-gear",
    name: "Tools & Gear",
    description: "Surrounded by mining tools and equipment",
    thumbnail: "/scenes/tools-and-gear.jpg",
  },
  {
    id: "damanjodi-aerial",
    name: "Damanjodi Aerial View",
    description: "Overlooking the vast mine and refinery",
    thumbnail: "/scenes/damanjodi-aerial.jpg",
  },
  {
    id: "pot-line-hall",
    name: "Pot Line Hall",
    description: "Walking the aluminium pot line",
    thumbnail: "/scenes/pot-line-hall.jpg",
  },
];
