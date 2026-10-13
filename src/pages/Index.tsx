import { useState } from "react";
import { Activity, ArrowUpRight, BookOpen, ChevronDown, Code2, Compass, Eye, Menu, Radio, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlannerForm } from "@/components/wayfinder/PlannerForm";
import { ItineraryView } from "@/components/wayfinder/ItineraryView";
import { TracePanel } from "@/components/wayfinder/TracePanel";
import { DEMO_REQUESTS, DEMO_TRACES } from "@/data/demo-traces";
import { runTravelAgent, TOOL_CATALOG, type TravelRequest } from "@/agent/travel-agent";

type AgentResult = ReturnType<typeof runTravelAgent>;

const Index = () => {
  const initial = DEMO_TRACES[0].run;
  const [request, setRequest] = useState<TravelRequest>(DEMO_REQUESTS[0].request);
  const [result, setResult] = useState<AgentResult>(initial);
  const [isRunning, setIsRunning] = useState(false);
  const [traceOpen, setTraceOpen] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleSubmit = () => {
    setIsRunning(true);
    window.setTimeout(() => {
      setResult(runTravelAgent(request));
      setIsRunning(false);
      setTraceOpen(true);
    }, 520);
  };

  const loadDemo = (index: number) => {
    setRequest(DEMO_REQUESTS[index].request);
    setResult(DEMO_TRACES[index].run);
    setTraceOpen(true);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8f2] text-[#173b39]">
      <header className="border-b border-[#e3e9df] bg-[#fdfdf8]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3"><div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#126867] text-[#eaf5ed]"><Compass className="h-5 w-5" /><span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#fdfdf8] bg-[#c39b56]" /></div><div><div className="font-display text-[17px] font-bold tracking-[-0.04em] text-[#173b39]">Wayfinder <span className="text-[#6d8e83]">Loop</span></div><p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-[#88a099] sm:block">Travel planning, made legible</p></div></div>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#668079] md:flex"><a href="#planner" className="transition hover:text-[#126867]">Planner</a><a href="#trace" className="transition hover:text-[#126867]">How it works</a><a href="#examples" className="transition hover:text-[#126867]">Examples</a></nav>
          <div className="flex items-center gap-3"><span className="hidden items-center gap-2 rounded-full border border-[#dce8dc] bg-[#f2f8f1] px-3 py-1.5 text-xs font-semibold text-[#568074] sm:flex"><Radio className="h-3 w-3 text-[#2b9b82]" /> Agent online</span><button type="button" className="rounded-xl p-2 text-[#668079] md:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation"><Menu className="h-5 w-5" /></button><Button variant="outline" className="hidden h-10 rounded-xl border-[#d8e5da] bg-[#fffdf8] text-xs font-bold text-[#35645c] shadow-none hover:bg-[#edf5ed] sm:flex" onClick={() => loadDemo(1)}>View Kyoto run <ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Button></div>
        </div>
        {mobileMenu && <nav className="flex flex-col gap-3 border-t border-[#e3e9df] px-5 py-4 text-sm font-semibold text-[#668079] md:hidden"><a href="#planner" onClick={() => setMobileMenu(false)}>Planner</a><a href="#trace" onClick={() => setMobileMenu(false)}>How it works</a><a href="#examples" onClick={() => setMobileMenu(false)}>Examples</a></nav>}
      </header>

      <main>
        <section className="mx-auto grid max-w-[1480px] gap-10 px-5 pb-12 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-16 lg:px-12 lg:pb-20 lg:pt-20">
          <div className="max-w-4xl">
            <div className="mb-7 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#338177]"><span className="h-px w-8 bg-[#6bb39d]" /> An agent for considered travel</div>
            <h1 className="max-w-4xl font-display text-[clamp(3.4rem,8vw,7.2rem)] font-semibold leading-[0.91] tracking-[-0.08em] text-[#173b39]">Make space for the <span className="text-[#23766f]">good</span> parts.</h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-[#637a73] sm:text-lg">Wayfinder turns a few travel constraints into a plan with room to breathe. No black box: watch every lookup, replan, and budget check as it happens.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3"><a href="#planner"><Button className="h-12 rounded-2xl bg-[#126867] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(18,104,103,0.18)] hover:bg-[#0e5756]">Plan a trip <ArrowUpRight className="ml-2 h-4 w-4" /></Button></a><button type="button" onClick={() => setTraceOpen(!traceOpen)} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[#d9e5da] bg-[#fffdf8] px-5 text-sm font-bold text-[#52746c] transition hover:bg-[#eef6ef]"><Eye className="h-4 w-4" /> {traceOpen ? "Hide" : "See"} the trace</button></div>
            <div className="mt-12 grid max-w-xl grid-cols-3 gap-5 border-t border-[#dce7dc] pt-6"><div><p className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#246960]">5</p><p className="mt-1 text-xs leading-5 text-[#82948e]">specialized tools<br />in the loop</p></div><div><p className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#246960]">100%</p><p className="mt-1 text-xs leading-5 text-[#82948e]">structured<br />outputs</p></div><div><p className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#246960]">0</p><p className="mt-1 text-xs leading-5 text-[#82948e]">hidden budget<br />overages</p></div></div>
            <div className="relative mt-14 hidden h-52 overflow-hidden rounded-[26px] sm:block" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1400&q=85')", backgroundPosition: "center 56%", backgroundSize: "cover" }}><div className="absolute inset-0 bg-[#173b39]/20" /><div className="absolute bottom-4 left-5 rounded-xl border border-white/30 bg-[#173b39]/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm"><span className="mr-2 text-[#b9dec9]">01</span> Lisbon, at a gentler pace</div></div>
          </div>
          <div id="planner" className="scroll-mt-8"><PlannerForm request={request} onChange={setRequest} onSubmit={handleSubmit} isRunning={isRunning} /></div>
        </section>

        <section id="examples" className="border-y border-[#e2e9df] bg-[#eff5ef] px-5 py-6 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-4 lg:flex-row lg:items-center"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dcefe5] text-[#26756b]"><BookOpen className="h-4 w-4" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#6a8a82]">Included with this demo</p><p className="mt-1 text-sm font-semibold text-[#365e57]">Two successful runs, preserved as inspectable traces</p></div></div><div className="flex flex-wrap gap-2">{DEMO_TRACES.map((demo, index) => <button key={demo.id} type="button" onClick={() => loadDemo(index)} className={`rounded-full border px-4 py-2 text-xs font-bold transition ${request.destination === demo.request.destination ? "border-[#147b75] bg-[#147b75] text-white" : "border-[#d2e1d5] bg-[#f9fcf7] text-[#5f7d74] hover:border-[#94c8b4]"}`}>{demo.title}</button>)}</div></div></section>

        <section className="mx-auto max-w-[1480px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#398378]"><Activity className="h-4 w-4" /> The result</div><h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-[#173b39] sm:text-4xl">A plan you can actually use.</h2></div><div className="flex items-center gap-2 text-sm font-semibold text-[#648079]"><span className="h-2 w-2 rounded-full bg-[#42a083]" /> {result.status === "success" ? "Loop completed successfully" : "Loop paused for clarification"}</div></div>{result.status === "success" && result.itinerary ? <ItineraryView itinerary={result.itinerary} /> : <div className="rounded-[28px] border border-[#e7cfc5] bg-[#fff7f2] p-8"><p className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#bb694f]">The loop stopped safely</p><h3 className="mt-3 font-display text-2xl font-semibold text-[#6f3e35]">One more detail will unlock the route.</h3><p className="mt-2 max-w-lg text-sm leading-6 text-[#986c60]">{result.clarification}</p><button type="button" onClick={() => setRequest(DEMO_REQUESTS[0].request)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#b8664f] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#a95640]"><RotateCcw className="h-3.5 w-3.5" /> Load a successful example</button></div>}
        </section>

        <section id="trace" className="scroll-mt-8 border-t border-[#e2e9df] bg-[#fbfcf8] px-5 py-12 sm:px-8 sm:py-16 lg:px-12"><div className="mx-auto max-w-[1480px]">{traceOpen ? <TracePanel trace={result.trace} /> : <button type="button" onClick={() => setTraceOpen(true)} className="flex w-full items-center justify-between rounded-[24px] border border-[#d5e2db] bg-[#f4f8f3] p-5 text-left transition hover:bg-[#edf5ef] sm:p-7"><span><span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#147b75]"><Code2 className="h-4 w-4" /> Technical trace</span><span className="mt-2 block font-display text-2xl font-semibold text-[#173b39]">Open the explicit agent loop</span></span><ChevronDown className="h-5 w-5 text-[#699189]" /></button>}</div></section>

        <section className="mx-auto max-w-[1480px] px-5 py-14 sm:px-8 lg:px-12"><div className="grid gap-5 md:grid-cols-5">{TOOL_CATALOG.map((tool, index) => <div key={tool.name} className="rounded-[22px] border border-[#e0e8df] bg-[#fffdf8] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9aab9f]">0{index + 1}</p><div className="mt-8 h-2 w-2 rounded-full bg-[#c19a57]" /><h3 className="mt-4 text-sm font-bold text-[#315952]">{tool.label}</h3><p className="mt-2 text-xs leading-5 text-[#80918c]">{tool.description}</p></div>)}</div></section>
      </main>
      <footer className="border-t border-[#e2e9df] bg-[#f1f5ef] px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-3 text-xs text-[#779089] sm:flex-row sm:items-center"><p>Wayfinder Loop · deterministic demo agent</p><p>Built to be inspected, not believed.</p></div></footer>
    </div>
  );
};

export default Index;
