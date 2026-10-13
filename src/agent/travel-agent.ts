export type Pace = "slow" | "balanced" | "full";

export type TravelRequest = {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  preferences: {
    pace: Pace;
    interests: string[];
    dietary: string;
  };
};

export type TraceStatus = "success" | "error" | "info";
export type TraceEventType = "plan" | "tool_call" | "tool_result" | "replan" | "final" | "clarification";

export type TraceEvent = {
  id: string;
  iteration: number;
  type: TraceEventType;
  label: string;
  detail: string;
  status: TraceStatus;
  tool?: string;
  input?: unknown;
  output?: unknown;
  durationMs?: number;
};

export type WeatherDay = {
  date: string;
  condition: string;
  high: number;
  low: number;
  rainChance: number;
};

export type LodgingOption = {
  name: string;
  neighborhood: string;
  nightlyRate: number;
  nights: number;
  total: number;
};

export type Activity = {
  name: string;
  category: string;
  duration: string;
  cost: number;
  note: string;
};

export type ItineraryDay = {
  date: string;
  theme: string;
  weather: string;
  morning: Activity;
  afternoon: Activity;
  evening: Activity;
  dayTotal: number;
};

export type Itinerary = {
  destination: string;
  dateLabel: string;
  weatherSummary: string;
  flight: { route: string; price: number; airline: string };
  lodging: LodgingOption;
  days: ItineraryDay[];
  totals: { transport: number; lodging: number; activities: number; estimated: number; budget: number };
  planningNotes: string[];
};

type ToolSuccess<T> = { status: "success"; data: T };
type ToolFailure = { status: "error"; errorType: "bad_input" | "no_results"; message: string };
type ToolResult<T> = ToolSuccess<T> | ToolFailure;

const toDateList = (start: string, end: string) => {
  const first = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime()) || first > last) return [];
  const dates: string[] = [];
  const cursor = new Date(first);
  while (cursor <= last && dates.length < 7) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const formatDate = (date: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00`));

const weatherLookup = (input: Pick<TravelRequest, "destination" | "startDate" | "endDate">): ToolResult<{ forecast: WeatherDay[]; summary: string }> => {
  if (!input.destination || !input.startDate || !input.endDate) {
    return { status: "error", errorType: "bad_input", message: "Destination and a complete date range are required." };
  }
  if (input.destination.toLowerCase().includes("nowhere")) {
    return { status: "error", errorType: "no_results", message: "No forecast source covers this destination." };
  }
  const dates = toDateList(input.startDate, input.endDate);
  if (!dates.length) return { status: "error", errorType: "bad_input", message: "The date range could not be parsed." };
  const forecast = dates.map((date, index) => ({
    date,
    condition: ["Bright intervals", "Mild and clear", "Passing clouds", "Golden-hour sun"][index % 4],
    high: 21 + (index % 3),
    low: 14 + (index % 2),
    rainChance: [12, 8, 20, 10][index % 4],
  }));
  return { status: "success", data: { forecast, summary: `${forecast[0].condition.toLowerCase()} across ${forecast.length} days, with a light layer recommended after sunset.` } };
};

const flightPriceLookup = (input: Pick<TravelRequest, "destination" | "startDate" | "endDate" | "budget">): ToolResult<{ route: string; price: number; airline: string; checkedAt: string }> => {
  if (!input.destination || !input.startDate || !input.endDate || !input.budget) {
    return { status: "error", errorType: "bad_input", message: "Destination, dates, and budget are required for flight search." };
  }
  const key = input.destination.toLowerCase();
  if (key.includes("moon") || key.includes("nowhere")) return { status: "error", errorType: "no_results", message: "No bookable routes were returned for this destination." };
  const price = key.includes("kyoto") ? 684 : key.includes("copenhagen") ? 512 : key.includes("lisbon") ? 428 : 548;
  if (input.budget < price + 420) return { status: "error", errorType: "no_results", message: "Available flights would exceed the minimum budget envelope." };
  return { status: "success", data: { route: `JFK → ${input.destination}`, price, airline: key.includes("lisbon") ? "TAP Air Portugal" : "Northstar Air", checkedAt: "live mock · 08:42 UTC" } };
};

const lodgingLookup = (input: Pick<TravelRequest, "destination" | "startDate" | "endDate" | "budget">): ToolResult<LodgingOption> => {
  if (!input.destination || !input.startDate || !input.endDate || !input.budget) {
    return { status: "error", errorType: "bad_input", message: "Destination, dates, and budget are required for lodging search." };
  }
  const dates = toDateList(input.startDate, input.endDate);
  if (!dates.length) return { status: "error", errorType: "bad_input", message: "The stay dates are not valid." };
  const key = input.destination.toLowerCase();
  const nightlyRate = key.includes("kyoto") ? 168 : key.includes("copenhagen") ? 154 : 132;
  const nights = Math.max(1, dates.length - 1);
  if (input.budget < nightlyRate * nights + 430) return { status: "error", errorType: "no_results", message: "No lodging option fits with transport inside this budget." };
  return { status: "success", data: { name: key.includes("lisbon") ? "Casa do Pátio" : "The Juniper House", neighborhood: key.includes("kyoto") ? "Higashiyama" : "Alfama", nightlyRate, nights, total: nightlyRate * nights } };
};

const attractionsLookup = (input: Pick<TravelRequest, "destination" | "preferences">): ToolResult<{ activities: Activity[] }> => {
  if (!input.destination) return { status: "error", errorType: "bad_input", message: "A destination is required to find activities." };
  if (input.destination.toLowerCase().includes("nowhere")) return { status: "error", errorType: "no_results", message: "No attractions matched the selected interests." };
  const key = input.destination.toLowerCase();
  const isKyoto = key.includes("kyoto");
  const interest = input.preferences.interests[0] || "local culture";
  const activities: Activity[] = isKyoto ? [
    { name: "Philosopher's Path", category: "slow morning", duration: "2 hrs", cost: 0, note: "Quiet canal walk with temple views." },
    { name: "Nishiki Market tasting", category: interest, duration: "90 min", cost: 24, note: "Small plates with vegetarian options flagged." },
    { name: "Kiyomizu-dera at dusk", category: "heritage", duration: "2 hrs", cost: 8, note: "Arrive before the lanterns come on." },
    { name: "Tea ceremony in Gion", category: "local craft", duration: "75 min", cost: 42, note: "Small group, English introduction." },
    { name: "Arashiyama bamboo grove", category: "nature", duration: "3 hrs", cost: 0, note: "Early start keeps the route unhurried." },
    { name: "Pontocho supper stroll", category: "food", duration: "2 hrs", cost: 52, note: "Reserve a counter seat; vegetarian set available." },
  ] : [
    { name: "Alfama miradouro walk", category: "slow morning", duration: "2 hrs", cost: 0, note: "A gentle hill route between two viewpoints." },
    { name: "Tile atelier visit", category: interest, duration: "75 min", cost: 18, note: "Hands-on azulejo workshop with a take-home tile." },
    { name: "Belém waterfront loop", category: "heritage", duration: "3 hrs", cost: 9, note: "Riverside walk with a pastel de nata stop." },
    { name: "Fado listening room", category: "local culture", duration: "2 hrs", cost: 38, note: "Intimate early set, no late-night finish." },
    { name: "Cascais day rail", category: "nature", duration: "4 hrs", cost: 16, note: "Easy coastal reset with a picnic option." },
    { name: "Mercado da Ribeira supper", category: "food", duration: "90 min", cost: 34, note: "Plenty of dairy-free plates to choose from." },
  ];
  return { status: "success", data: { activities } };
};

const assembleItinerary = (input: TravelRequest, weather: { forecast: WeatherDay[]; summary: string }, flight: { route: string; price: number; airline: string }, lodging: LodgingOption, activityResult: { activities: Activity[] }): ToolResult<Itinerary> => {
  const dates = toDateList(input.startDate, input.endDate);
  const pool = activityResult.activities;
  const dayCount = Math.min(dates.length, 5);
  const days = Array.from({ length: dayCount }, (_, index) => {
    const morning = pool[(index * 2) % pool.length];
    const afternoon = pool[(index * 2 + 1) % pool.length];
    const evening = pool[(index * 2 + 2) % pool.length];
    return {
      date: dates[index],
      theme: ["Arrive & orient", "Texture and tradition", "A wider horizon", "Local rhythm", "A soft landing"][index],
      weather: `${weather.forecast[index].condition} · ${weather.forecast[index].high}° / ${weather.forecast[index].low}°`,
      morning,
      afternoon,
      evening,
      dayTotal: morning.cost + afternoon.cost + evening.cost,
    };
  });
  const activities = days.reduce((total, day) => total + day.dayTotal, 0);
  const estimated = flight.price + lodging.total + activities;
  if (estimated > input.budget) return { status: "error", errorType: "no_results", message: "The assembled plan is above budget; a slower pace or a larger budget is needed." };
  return { status: "success", data: {
    destination: input.destination,
    dateLabel: `${formatDate(input.startDate)} — ${formatDate(input.endDate)}`,
    weatherSummary: weather.summary,
    flight,
    lodging,
    days,
    totals: { transport: flight.price, lodging: lodging.total, activities, estimated, budget: input.budget },
    planningNotes: [
      `Built for a ${input.preferences.pace} pace with ${input.preferences.interests.join(" + ") || "local culture"}.`,
      `${input.preferences.dietary} options are prioritized in the food stops.`,
      "Prices are deterministic demo data, ready to swap for live providers.",
    ],
  } };
};

export const runTravelAgent = (request: TravelRequest): { status: "success" | "needs_clarification"; request: TravelRequest; itinerary?: Itinerary; clarification?: string; trace: TraceEvent[] } => {
  const trace: TraceEvent[] = [];
  let eventId = 0;
  const add = (event: Omit<TraceEvent, "id">) => trace.push({ ...event, id: `event-${++eventId}` });
  add({ iteration: 0, type: "plan", label: "Agent received request", detail: `Planning ${request.destination || "an unknown destination"} within a $${request.budget || 0} envelope.`, status: "info", input: request });
  if (!request.destination || !request.startDate || !request.endDate || request.budget <= 0) {
    add({ iteration: 0, type: "clarification", label: "Clarification needed", detail: "Add a destination, complete dates, and a positive budget before I can call travel tools.", status: "error" });
    return { status: "needs_clarification", request, clarification: "Add a destination, complete dates, and a positive budget to continue.", trace };
  }
  const maxIterations = 3;
  let iteration = 1;
  while (iteration <= maxIterations) {
    add({ iteration: 1, type: "plan", label: "Plan → gather constraints", detail: "I will check conditions, transport, lodging, and activities before composing days.", status: "info", input: { tools: ["weather_lookup", "flight_price_lookup", "lodging_lookup", "attractions_lookup"] } });
    const weather = weatherLookup(request);
  add({ iteration: 1, type: "tool_call", label: "Weather lookup", detail: "Checking forecast for the selected dates.", status: "info", tool: "weather_lookup", input: { destination: request.destination, startDate: request.startDate, endDate: request.endDate }, durationMs: 112 });
  add({ iteration: 1, type: "tool_result", label: "Weather returned", detail: weather.status === "success" ? weather.data.summary : weather.message, status: weather.status === "success" ? "success" : "error", tool: "weather_lookup", output: weather });
  const flight = flightPriceLookup(request);
  add({ iteration: 1, type: "tool_call", label: "Flight price lookup", detail: "Looking for a route that leaves room for the stay and daily plan.", status: "info", tool: "flight_price_lookup", input: { destination: request.destination, budget: request.budget }, durationMs: 146 });
  add({ iteration: 1, type: "tool_result", label: "Flight price returned", detail: flight.status === "success" ? `${flight.data.airline} · $${flight.data.price}` : flight.message, status: flight.status === "success" ? "success" : "error", tool: "flight_price_lookup", output: flight });
  const lodging = lodgingLookup(request);
  add({ iteration: 1, type: "tool_call", label: "Lodging lookup", detail: "Finding a central stay with the remaining budget.", status: "info", tool: "lodging_lookup", input: { destination: request.destination, dates: [request.startDate, request.endDate], budget: request.budget }, durationMs: 127 });
  add({ iteration: 1, type: "tool_result", label: "Lodging returned", detail: lodging.status === "success" ? `${lodging.data.name} · $${lodging.data.total} total` : lodging.message, status: lodging.status === "success" ? "success" : "error", tool: "lodging_lookup", output: lodging });
  const activities = attractionsLookup(request);
  add({ iteration: 1, type: "tool_call", label: "Attractions lookup", detail: "Matching activities to pace, interests, and dietary needs.", status: "info", tool: "attractions_lookup", input: { destination: request.destination, preferences: request.preferences }, durationMs: 134 });
  add({ iteration: 1, type: "tool_result", label: "Activities returned", detail: activities.status === "success" ? `${activities.data.activities.length} activities matched.` : activities.message, status: activities.status === "success" ? "success" : "error", tool: "attractions_lookup", output: activities });
  if (weather.status !== "success" || flight.status !== "success" || lodging.status !== "success" || activities.status !== "success") {
    add({ iteration: 2, type: "replan", label: "Replan → protect the budget", detail: "A required provider returned no results. I will stop rather than invent availability and ask for one clarifying change.", status: "info", input: { failedTools: [weather, flight, lodging, activities].filter((result) => result.status === "error").map((result) => result.errorType) } });
    add({ iteration: 2, type: "clarification", label: "Clarification needed", detail: "Try a nearby destination, a wider date window, or a larger budget; the loop terminated cleanly.", status: "error" });
    return { status: "needs_clarification", request, clarification: "I could not find a complete set of options. Try a nearby destination, a wider date window, or a larger budget.", trace };
  }
  const itinerary = assembleItinerary(request, weather.data, flight.data, lodging.data, activities.data);
  add({ iteration: 2, type: "tool_call", label: "Day planner", detail: "Assembling a day-by-day plan and checking the total against budget.", status: "info", tool: "calendar_day_planner", input: { destination: request.destination, dates: [request.startDate, request.endDate], pace: request.preferences.pace }, durationMs: 156 });
  add({ iteration: 2, type: "tool_result", label: "Day planner returned", detail: itinerary.status === "success" ? `${itinerary.data.days.length} days assembled · $${itinerary.data.totals.estimated} estimated` : itinerary.message, status: itinerary.status === "success" ? "success" : "error", tool: "calendar_day_planner", output: itinerary });
  if (itinerary.status !== "success") {
    add({ iteration: 3, type: "replan", label: "Replan → no hidden overages", detail: "The assembled days exceed the requested budget, so I am asking for a larger envelope instead of hiding a cost.", status: "info" });
    add({ iteration: 3, type: "clarification", label: "Clarification needed", detail: itinerary.message, status: "error" });
    return { status: "needs_clarification", request, clarification: itinerary.message, trace };
  }
    add({ iteration: 3, type: "final", label: "Structured itinerary ready", detail: `Final answer validated: ${itinerary.data.days.length} days, $${itinerary.data.totals.estimated} estimated of $${request.budget}.`, status: "success", output: itinerary.data });
    iteration += 1;
    return { status: "success", request, itinerary: itinerary.data, trace };
  }
  return { status: "needs_clarification", request, clarification: "The agent reached its iteration limit without a complete plan.", trace };
};

export const TOOL_CATALOG = [
  { name: "weather_lookup", label: "Weather", icon: "cloud-sun", description: "Forecast for the exact travel dates." },
  { name: "flight_price_lookup", label: "Flights", icon: "plane", description: "Route and price inside the budget envelope." },
  { name: "lodging_lookup", label: "Lodging", icon: "bed", description: "Central stay with transparent nightly total." },
  { name: "attractions_lookup", label: "Activities", icon: "ticket", description: "Interest and pace-aware local matches." },
  { name: "calendar_day_planner", label: "Day planner", icon: "calendar", description: "Composes and validates the final days." },
];
