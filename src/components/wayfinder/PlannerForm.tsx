import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpRight, Check, LoaderCircle, Sparkles } from "lucide-react";
import type { TravelRequest, Pace } from "@/agent/travel-agent";

type PlannerFormProps = {
  request: TravelRequest;
  onChange: (request: TravelRequest) => void;
  onSubmit: () => void;
  isRunning: boolean;
};

const interestOptions = ["Local culture", "Food", "Nature", "Design", "Heritage"];
const dietaryOptions = ["No restrictions", "Vegetarian", "Vegan", "Gluten-free"];

export function PlannerForm({ request, onChange, onSubmit, isRunning }: PlannerFormProps) {
  const set = (patch: Partial<TravelRequest>) => onChange({ ...request, ...patch });
  const setPreferences = (patch: Partial<TravelRequest["preferences"]>) => set({ preferences: { ...request.preferences, ...patch } });
  const toggleInterest = (interest: string) => {
    const exists = request.preferences.interests.includes(interest.toLowerCase());
    setPreferences({ interests: exists ? request.preferences.interests.filter((item) => item !== interest.toLowerCase()) : [...request.preferences.interests, interest.toLowerCase()] });
  };

  return (
    <section className="rounded-[28px] border border-[#d9e2dc] bg-[#fffdf8] p-5 shadow-[0_24px_70px_rgba(38,67,60,0.08)] sm:p-7">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#147b75]"><Sparkles className="h-3.5 w-3.5" /> Start a new plan</p>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[#173b39]">Where should we wander?</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#667875]">Give the loop a few anchors. It will balance the details, then show you exactly how it got there.</p>
        </div>
        <div className="hidden rounded-2xl bg-[#edf5ef] px-3 py-2 text-right sm:block"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6c8580]">Mode</p><p className="mt-0.5 text-xs font-semibold text-[#23635e]">Concierge / live mock</p></div>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="destination" className="text-xs font-bold uppercase tracking-[0.14em] text-[#45635e]">Destination</Label>
          <Input id="destination" value={request.destination} onChange={(event) => set({ destination: event.target.value })} placeholder="Lisbon, Kyoto, Copenhagen..." className="mt-2 h-12 rounded-2xl border-[#d5e2db] bg-[#fbfcf8] px-4 text-[15px] text-[#173b39] shadow-none placeholder:text-[#9aaba5] focus-visible:ring-[#147b75]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="startDate" className="text-xs font-bold uppercase tracking-[0.14em] text-[#45635e]">Arrive</Label><Input id="startDate" type="date" value={request.startDate} onChange={(event) => set({ startDate: event.target.value })} className="mt-2 h-12 rounded-2xl border-[#d5e2db] bg-[#fbfcf8] text-[#173b39] shadow-none focus-visible:ring-[#147b75]" /></div>
          <div><Label htmlFor="endDate" className="text-xs font-bold uppercase tracking-[0.14em] text-[#45635e]">Depart</Label><Input id="endDate" type="date" value={request.endDate} onChange={(event) => set({ endDate: event.target.value })} className="mt-2 h-12 rounded-2xl border-[#d5e2db] bg-[#fbfcf8] text-[#173b39] shadow-none focus-visible:ring-[#147b75]" /></div>
        </div>
        <div>
          <div className="flex items-end justify-between gap-4"><Label htmlFor="budget" className="text-xs font-bold uppercase tracking-[0.14em] text-[#45635e]">Total budget</Label><span className="text-xs text-[#81938e]">USD · including flights</span></div>
          <div className="relative mt-2"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71908a]">$</span><Input id="budget" type="number" min="1" value={request.budget} onChange={(event) => set({ budget: Number(event.target.value) })} className="h-12 rounded-2xl border-[#d5e2db] bg-[#fbfcf8] pl-8 text-[15px] text-[#173b39] shadow-none focus-visible:ring-[#147b75]" /></div>
        </div>

        <div className="border-t border-[#e4ebe5] pt-6">
          <div className="mb-3 flex items-center justify-between"><Label className="text-xs font-bold uppercase tracking-[0.14em] text-[#45635e]">Pace</Label><span className="text-xs capitalize text-[#81938e]">{request.preferences.pace} days</span></div>
          <div className="grid grid-cols-3 gap-2">
            {(["slow", "balanced", "full"] as Pace[]).map((pace) => <button key={pace} type="button" onClick={() => setPreferences({ pace })} className={`rounded-2xl border px-3 py-3 text-left transition ${request.preferences.pace === pace ? "border-[#147b75] bg-[#e6f3ed] text-[#135e59]" : "border-[#dce6df] bg-[#fbfcf8] text-[#6c7e79] hover:border-[#9bc5b8]"}`}><span className="block text-sm font-semibold capitalize">{pace}</span><span className="mt-0.5 block text-[11px] leading-4 opacity-75">{pace === "slow" ? "Room to breathe" : pace === "balanced" ? "A little of everything" : "Make the most of it"}</span></button>)}
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold uppercase tracking-[0.14em] text-[#45635e]">Interests</Label>
          <div className="mt-3 flex flex-wrap gap-2">{interestOptions.map((interest) => { const selected = request.preferences.interests.includes(interest.toLowerCase()); return <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${selected ? "border-[#147b75] bg-[#147b75] text-white" : "border-[#dce6df] bg-[#fbfcf8] text-[#647b74] hover:border-[#9bc5b8]"}`}>{selected && <Check className="h-3.5 w-3.5" />}{interest}</button>; })}</div>
        </div>

        <div>
          <Label htmlFor="dietary" className="text-xs font-bold uppercase tracking-[0.14em] text-[#45635e]">Dietary notes</Label>
          <select id="dietary" value={request.preferences.dietary} onChange={(event) => setPreferences({ dietary: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-[#d5e2db] bg-[#fbfcf8] px-4 text-sm text-[#173b39] outline-none focus:border-[#147b75] focus:ring-2 focus:ring-[#147b75]/15">{dietaryOptions.map((dietary) => <option key={dietary}>{dietary}</option>)}</select>
        </div>
        <Button type="button" onClick={onSubmit} disabled={isRunning} className="h-14 w-full rounded-2xl bg-[#126867] text-sm font-bold text-white shadow-[0_12px_26px_rgba(18,104,103,0.22)] transition hover:bg-[#0e5756] disabled:opacity-70">{isRunning ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Running the loop...</> : <>Build my itinerary <ArrowUpRight className="ml-2 h-4 w-4" /></>}</Button>
      </div>
    </section>
  );
}
