export interface SceneOption {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
}

// IDs here must match functions/src/scenes.ts exactly — the id is what
// gets sent to the backend to pick the compositing prompt + reference photo.
// All photos are real NALCO photography from the official homepage carousel.
export const SCENES: SceneOption[] = [
  {
    id: "port-terminal",
    name: "Port Terminal",
    description: "Cranes and cargo ships at the shipping terminal",
    thumbnail: "/scenes/port-terminal.jpg",
  },
  {
    id: "mine-access-road",
    name: "Mine Access Road",
    description: "On the red-earth road into the mine",
    thumbnail: "/scenes/mine-access-road.jpg",
  },
  {
    id: "refinery-mountains",
    name: "Refinery View",
    description: "The refinery against the hills",
    thumbnail: "/scenes/refinery-mountains.jpg",
  },
  {
    id: "corporate-hq",
    name: "Corporate HQ",
    description: "In front of the head office building",
    thumbnail: "/scenes/corporate-hq.jpg",
  },
  {
    id: "refinery-aerial",
    name: "Refinery Aerial",
    description: "Sweeping view of the refinery complex",
    thumbnail: "/scenes/refinery-aerial.jpg",
  },
  {
    id: "ingot-warehouse",
    name: "Ingot Warehouse",
    description: "Beside stacks of aluminium ingots",
    thumbnail: "/scenes/ingot-warehouse.jpg",
  },
  {
    id: "power-plant",
    name: "Power Plant",
    description: "Under the power plant's tall chimneys",
    thumbnail: "/scenes/power-plant.jpg",
  },
  {
    id: "mining-fleet",
    name: "Mining Fleet",
    description: "Among the trucks and excavators at work",
    thumbnail: "/scenes/mining-fleet.jpg",
  },
  {
    id: "wind-farm",
    name: "Wind Farm",
    description: "On the hillside among the wind turbines",
    thumbnail: "/scenes/wind-farm.jpg",
  },
];
