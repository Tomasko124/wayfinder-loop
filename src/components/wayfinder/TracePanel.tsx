import { useState } from "react";
import { ChevronDown, CircleAlert, CircleCheck, Code2, GitBranch, LoaderCircle, Wrench } from "lucide-react";
import type { TraceEvent } from "@/agent/travel-agent";

const iconFor = (event: TraceEvent) => {
  if (event.type === "tool_call" || event.type === "tool_result") return <Wrench className="h-3.5 w-3.5" />;
  if (event.type === "replan") return <GitBranch className="h-3.5 w-3.5" />;
  if (event.type === "final") return <CircleCheck className="h-3.5 w-3.5" />;
  if (event.type === "clarification") return <CircleAlert className="h-3.5 w-3.5" />;
  return <Code2 className="h-3.5 w-3.5" />;
};

export function TracePanel({ trace, compact = false }: { trace: TraceEvent[]; compact?: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(trace.find((event) => event.type === "final")?.id || trace[trace.length - 1]?.id || null);
  const tools = trace.filter((event) => event.type === "tool_call").length;
  return (
    <section className={`rounded-[28px] border border-[#d5e2db] bg-[#f4f8f3] ${compact ? "p-4" : "p-5 sm:p-7"}`}>
      <div className="flex items-start justify-between gap-4">
        <div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#147b75]"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#dcefe7]"><Code2 className="h-3.5 w-3.5" /></span> Technical trace</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[#173b39]">The loop, in plain sight</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[#6b817b]">Every decision is inspectable: plan, call, structured result, and final validation.</p></div>
        <div className="hidden rounded-2xl border border-[#d9e5dc] bg-[#fbfdf9] px-3 py-2 text-right sm:block"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#76908a]">Events</p><p className="mt-0.5 text-sm font-bold text-[#23635e]">{trace.length} <span className="font-normal text-[#8aa09a]">/ {tools} tools</span></p></div>
      </div>
      <div className="mt-7 space-y-2">
        {trace.map((event, index) => { const open = expanded === event.id; const isError = event.status === "error"; return <div key={event.id} className="relative pl-8"><div className="absolute bottom-[-9px] left-[13px] top-8 w-px bg-[#d4e2d9] last:hidden" />
          <div className={`absolute left-0 top-3 flex h-7 w-7 items-center justify-center rounded-full border ${isError ? "border-[#e2b5a7] bg-[#fff1eb] text-[#bb6049]" : event.type === "final" ? "border-[#a9d3bd] bg-[#dff2e7] text-[#1f806f]" : "border-[#cddfd5] bg-[#fbfdf9] text-[#5d8d7f]"}`}>{event.status === "info" && event.type === "tool_call" ? <LoaderCircle className="h-3.5 w-3.5" /> : iconFor(event)}</div>
          <button type="button" onClick={() => setExpanded(open ? null : event.id)} className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${open ? "border-[#c7dcd1] bg-[#fbfdf9]" : "border-transparent hover:border-[#dbe8df] hover:bg-[#fbfdf9]/70"}`}><span className="min-w-0"><span className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#274b45]"><span>{event.label}</span>{event.tool && <span className="rounded-md bg-[#e7f0e9] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#648078]">{event.tool}</span>}</span><span className="mt-1 block truncate text-xs text-[#7b908a]">{event.detail}</span></span><ChevronDown className={`h-4 w-4 shrink-0 text-[#78928a] transition ${open ? "rotate-180" : ""}`} /></button>
          {open && <div className="mb-2 rounded-b-2xl border-x border-b border-[#d8e5dc] bg-[#fbfdf9] px-4 pb-4 pt-1"><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#879b95]"><span className={`h-1.5 w-1.5 rounded-full ${isError ? "bg-[#c76d56]" : event.status === "success" ? "bg-[#4a9b82]" : "bg-[#c69b4b]"}`} /> iteration {event.iteration} · {event.status}</div>{(event.input || event.output) && <pre className="max-h-52 overflow-auto rounded-xl bg-[#183b39] p-3 font-mono text-[10px] leading-5 text-[#d5ece2]">{JSON.stringify({ input: event.input, output: event.output }, null, 2)}</pre>}</div>}
        </div>; })}
      </div>
    </section>
  );
}
