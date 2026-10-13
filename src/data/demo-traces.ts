import { runTravelAgent, type TravelRequest } from "@/agent/travel-agent";

export const DEMO_REQUESTS: { id: string; title: string; request: TravelRequest }[] = [
  {
    id: "lisbon-slow",
    title: "Lisbon · slow culture",
    request: {
      destination: "Lisbon",
      startDate: "2025-09-12",
      endDate: "2025-09-15",
      budget: 2200,
      preferences: { pace: "slow", interests: ["local culture", "food"], dietary: "Vegetarian" },
    },
  },
  {
    id: "kyoto-balanced",
    title: "Kyoto · balanced craft",
    request: {
      destination: "Kyoto",
      startDate: "2025-10-03",
      endDate: "2025-10-07",
      budget: 2600,
      preferences: { pace: "balanced", interests: ["heritage", "nature"], dietary: "Vegetarian" },
    },
  },
];

export const DEMO_TRACES = DEMO_REQUESTS.map((demo) => ({
  ...demo,
  run: runTravelAgent(demo.request),
}));
