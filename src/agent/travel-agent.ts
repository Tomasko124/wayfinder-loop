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
  flight: { route: string; price: number; airline: string; checkedAt: string };
  lodging: LodgingOption;
  days: ItineraryDay[];
  totals: { transport: number; lodging: number; activities: number; estimated: number; budget: number };
  planningNotes: string[];
};

type ToolSuccess<T> = { status: "success"; data: T };
type ToolFailure = { status: "error"; errorType: "bad_input" | "no_results"; message: string };
type ToolResult<T> = ToolSuccess<T> | ToolFailure;

type WeatherData = { forecast: WeatherDay[]; summary: string };
type FlightData = { route: string; price: number; airline: string; checkedAt: string };
type ActivityData = { activities: Activity[] };

const MIN_TRIP_DAYS = 2;
const MAX_TRIP_DAYS = 7;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const parseDateOnly = (value: string) => {
  if (!datePattern.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return parsed;
};

const toDateList = (start: string, end: string) => {
  const first = parseDateOnly(start);
  const last = parseDateOnly(end);
  if (!first || !last || first > last) return [];
  const dates: string[] = [];
  const cursor = new Date(first);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

const formatDate = (date: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(parseDateOnly(date) as Date);

const validateRequest = (request: TravelRequest): ToolFailure | null => {
  if (!request.destination.trim()) return { status: "error", errorType: "bad_input", message: "Choose a destination before planning." };
  if (!parseDateOnly(request.startDate) || !parseDateOnly(request.endDate)) return { status: "error", errorType: "bad_input", message: "Use valid dates in YYYY-MM-DD format." };
  const dates = toDateList(request.startDate, request.endDate);
  if (!dates.length) return { status: "error", errorType: "bad_input", message: "The departure date must be on or after the arrival date." };
  if (dates.length < MIN_TRIP_DAYS || dates.length > MAX_TRIP_DAYS) return { status: "error", errorType: "bad_input", message: `Choose a trip between ${MIN_TRIP_DAYS} and ${MAX_TRIP_DAYS} calendar days.` };
  if (!Number.isFinite(request.budget) || request.budget <= 0) return { status: "error", errorType: "bad_input", message: "Budget must be a positive number." };
  return null;
};

const weatherLookup = (input: Pick<TravelRequest, "destination" | "startDate" | "endDate">): ToolResult<WeatherData> => {
  if (!input.destination.trim() || !input.startDate || !input.endDate) return { status: "error", errorType: "bad_input", message: "Destination and a complete date range are required." };
  if (input.destination.toLowerCase().includes("nowhere")) return { status: "error", errorType: "no_results", message: "No forecast source covers this destination." };
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

const flightPriceLookup = (input: Pick<TravelRequest, "destination" | "startDate" | "endDate" | "budget">): ToolResult<FlightData> => {
  if (!input.destination.trim() || !input.startDate || !input.endDate || !Number.isFinite(input.budget) || input.budget <= 0) return { status: "error", errorType: "bad_input", message: "Destination, dates, and a positive budget are required for flight search." };
  const key = input.destination.toLowerCase();
  if (key.includes("moon") || key.includes("nowhere")) return { status: "error", errorType: "no_results", message: "No bookable routes were returned for this destination." };
  const price = key.includes("kyoto") ? 684 : key.includes("copenhagen") ? 512 : key.includes("lisbon") ? 428 : 548;
  if (input.budget < price + 420) return { status: "error", errorType: "no_results", message: "Available flights would exceed the minimum budget envelope." };
  return { status: "success", data: { route: `JFK → ${input.destination}`, price, airline: key.includes("lisbon") ? "TAP Air Portugal" : "Northstar Air", checkedAt: "live mock · 08:42 UTC" } };
};

const lodgingLookup = (input: Pick<TravelRequest, "destination" | "startDate" | "endDate" | "budget">): ToolResult<LodgingOption> => {
  if (!input.destination.trim() || !input.startDate || !input.endDate || !Number.isFinite(input.budget) || input.budget <= 0) return { status: "error", errorType: "bad_input", message: "Destination, dates, and a positive budget are required for lodging search." };
  const dates = toDateList(input.startDate, input.endDate);
  if (dates.length < MIN_TRIP_DAYS || dates.length > MAX_TRIP_DAYS) return { status: "error", errorType: "bad_input", message: "The stay must be between 2 and 7 calendar days." };
  const key = input.destination.toLowerCase();
  const nightlyRate = key.includes("kyoto") ? 168 : key.includes("copenhagen") ? 154 : 132;
  const nights = dates.length - 1;
  if (input.budget < nightlyRate * nights + 430) return { status: "error", errorType: "no_results", message: "No lodging option fits with transport inside this budget." };
  return { status: "success", data: { name: key.includes("lisbon") ? "Casa do Pátio" : "The Juniper House", neighborhood: key.includes("kyoto") ? "Higashiyama" : "Alfama", nightlyRate, nights, total: nightlyRate * nights } };
};

const attractionsLookup = (input: Pick<TravelRequest, "destination" | "preferences">): ToolResult<ActivityData> => {
  if (!input.destination.trim()) return { status: "error", errorType: "bad_input", message: "A destination is required to find activities." };
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

const calendarDayPlanner = (input: TravelRequest, weather: WeatherData, flight: FlightData, lodging: LodgingOption, activityResult: ActivityData): ToolResult<Itinerary> => {
  const dates = toDateList(input.startDate, input.endDate);
  if (dates.length !== lodging.nights + 1) return { status: "error", errorType: "bad_input", message: "The itinerary days and lodging nights do not align." };
  if (!activityResult.activities.length || weather.forecast.length !== dates.length) return { status: "error", errorType: "no_results", message: "There are not enough activities or forecast entries to assemble the trip." };
  const pool = activityResult.activities;
  const themes = ["Arrive & orient", "Texture and tradition", "A wider horizon", "Local rhythm", "A soft landing", "A deeper local turn", "Last light"];
  const days = dates.map((date, index) => {
    const morning = pool[(index * 2) % pool.length];
    const afternoon = pool[(index * 2 + 1) % pool.length];
    const evening = pool[(index * 2 + 2) % pool.length];
    const dayTotal = morning.cost + afternoon.cost + evening.cost;
    return { date, theme: themes[index], weather: `${weather.forecast[index].condition} · ${weather.forecast[index].high}° / ${weather.forecast[index].low}°`, morning, afternoon, evening, dayTotal };
  });
  const activities = days.flatMap((day) => [day.morning.cost, day.afternoon.cost, day.evening.cost]).reduce((total, cost) => total + cost, 0);
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

type ToolPlan = {
  key: "weather" | "flight" | "lodging" | "activities" | "calendar";
  tool: string;
  label: string;
  detail: string;
  input: unknown;
  durationMs: number;
  execute: () => ToolResult<unknown>;
};

const runTravelTool = <T>(plan: Omit<ToolPlan, "execute"> & { execute: () => ToolResult<T> }, add: (event: Omit<TraceEvent, "id">) => void): ToolResult<T> => {
  add({ iteration: 1, type: "tool_call", label: plan.label, detail: plan.detail, status: "info", tool: plan.tool, input: plan.input, durationMs: plan.durationMs });
  const result = plan.execute();
  add({ iteration: 1, type: "tool_result", label: `${plan.label.replace(" lookup", "")} returned`, detail: result.status === "success" ? "Structured result returned." : result.message, status: result.status === "success" ? "success" : "error", tool: plan.tool, output: result });
  return result;
};

export const runTravelAgent = (request: TravelRequest): { status: "success" | "needs_clarification"; request: TravelRequest; itinerary?: Itinerary; clarification?: string; trace: TraceEvent[] } => {
  const trace: TraceEvent[] = [];
  let eventId = 0;
  const add = (event: Omit<TraceEvent, "id">) => trace.push({ ...event, id: `event-${++eventId}` });
  add({ iteration: 0, type: "plan", label: "Agent received request", detail: `Planning ${request.destination || "an unknown destination"} within a $${request.budget || 0} envelope.`, status: "info", input: request });

  const validationError = validateRequest(request);
  if (validationError) {
    add({ iteration: 0, type: "clarification", label: "Clarification needed", detail: validationError.message, status: "error", output: validationError });
    return { status: "needs_clarification", request, clarification: validationError.message, trace };
  }

  add({ iteration: 1, type: "plan", label: "Plan → gather constraints", detail: "I will check conditions, transport, lodging, and activities before composing days.", status: "info", input: { tools: ["weather_lookup", "flight_price_lookup", "lodging_lookup", "attractions_lookup"] } });
  const toolPlans: ToolPlan[] = [
    { key: "weather", tool: "weather_lookup", label: "Weather lookup", detail: "Checking forecast for the selected dates.", input: { destination: request.destination, startDate: request.startDate, endDate: request.endDate }, durationMs: 112, execute: () => weatherLookup(request) },
    { key: "flight", tool: "flight_price_lookup", label: "Flight price lookup", detail: "Looking for a route that leaves room for the stay and daily plan.", input: { destination: request.destination, budget: request.budget }, durationMs: 146, execute: () => flightPriceLookup(request) },
    { key: "lodging", tool: "lodging_lookup", label: "Lodging lookup", detail: "Finding a central stay with the remaining budget.", input: { destination: request.destination, dates: [request.startDate, request.endDate], budget: request.budget }, durationMs: 127, execute: () => lodgingLookup(request) },
    { key: "activities", tool: "Attractions lookup", detail: "Matching activities to pace, interests, and dietary needs.", label: "Attractions lookup", input: { destination: request.destination, preferences: request.preferences }, durationMs: 134, execute: () => attractionsLookup(request) },
  ];
  let weather: ToolResult<WeatherData> | undefined;
  let flight: ToolResult<FlightData> | undefined;
  let lodging: ToolResult<LodgingOption> | undefined;
  let activities: ToolResult<ActivityData> | undefined;
  let failedTool: ToolFailure | undefined;

  for (const plan of toolPlans) {
    const result = plan.key === "weather"
      ? runTravelTool({ ...plan, execute: () => weatherLookup(request) }, add)
      : plan.key === "flight"
        ? runTravelTool({ ...plan, execute: () => flightPriceLookup(request) }, add)
        : plan.key === "lodging"
          ? runTravelTool({ ...plan, execute: () => lodgingLookup(request) }, add)
          : runTravelTool({ ...plan, execute: () => attractionsLookup(request) }, add);
    if (plan.key === "weather") weather = result as ToolResult<WeatherData>;
    if (plan.key === "flight") flight = result as ToolResult<FlightData>;
    if (plan.key === "lodging") lodging = result as ToolResult<LodgingOption>;
    if (plan.key === "activities") activities = result as ToolResult<ActivityData>;
    if (result.status === "error") {
      failedTool = result;
      break;
    }
  }

  if (failedTool || weather?.status !== "success" || flight?.status !== "success" || lodging?.status !== "success" || activities?.status !== "success") {
    add({ iteration: 2, type: "replan", label: "Replan → clarify constraints", detail: "A required tool returned a structured error. No substitute data will be invented, so the loop is ending with a clear next step.", status: "info", input: { failedTool: failedTool?.errorType || "missing_result" } });
    add({ iteration: 2, type: "clarification", label: "Clarification needed", detail: failedTool?.message || "A required travel tool did not return a result.", status: "error", output: failedTool });
    return { status: "needs_clarification", request, clarification: failedTool?.message || "I could not find a complete set of options. Try a wider date window or a larger budget.", trace };
  }

  const itinerary = runTravelTool({ key: "calendar", tool: "calendar_day_planner", label: "Day planner", detail: "Assembling a day-by-day plan and checking the total against budget.", input: { destination: request.destination, dates: [request.startDate, request.endDate], pace: request.preferences.pace }, durationMs: 156, execute: () => calendarDayPlanner(request, weather.data, flight.data, lodging.data, activities.data) }, add);
  if (itinerary.status !== "success") {
    add({ iteration: 2, type: "replan", label: "Replan → no hidden overages", detail: "The day planner returned a structured error, so the loop is asking for a change instead of hiding a cost.", status: "info", input: { errorType: itinerary.errorType } });
    add({ iteration: 2, type: "clarification", label: "Clarification needed", detail: itinerary.message, status: "error", output: itinerary });
    return { status: "needs_clarification", request, clarification: itinerary.message, trace };
  }

  add({ iteration: 3, type: "final", label: "Structured itinerary ready", detail: `Final answer validated: ${itinerary.data.days.length} days, $${itinerary.data.totals.estimated} estimated of $${request.budget}.`, status: "success", output: itinerary.data });
  return { status: "success", request, itinerary: itinerary.data, trace };
};

export const TOOL_CATALOG = [
  { name: "weather_lookup", label: "Weather", icon: "cloud-sun", description: "Forecast for the exact travel dates." },
  { name: "flight_price_lookup", label: "Flights", icon: "plane", description: "Route and price inside the budget envelope." },
  { name: "lodging_lookup", label: "Lodging", icon: "bed", description: "Central stay with transparent nightly total." },
  { name: "attractions_lookup", label: "Activities", icon: "ticket", description: "Interest and pace-aware local matches." },
  { name: "calendar_day_planner", label: "Day planner", icon: "calendar", description: "Composes and validates the final days." },
];
