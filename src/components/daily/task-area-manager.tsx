"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { saveTaskAreas, type DailyFormState } from "@/app/daily/actions";

const initialState: DailyFormState = {};

export function TaskAreaManager({ areas }: { areas: string[] }) {
  const [items, setItems] = useState(areas);
  const [state, formAction, pending] = useActionState(saveTaskAreas, initialState);
  const payload = useMemo(() => JSON.stringify(items), [items]);

  return <details className="panel self-start rounded-xl"><summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 font-semibold text-white"><span className="text-orange-400">Areas</span><span className="text-sm font-normal text-zinc-400">Organize the types of work in your plan</span></summary><form action={formAction} className="border-t border-zinc-700 p-5"><input name="areas" type="hidden" value={payload} /><div className="max-w-xl space-y-3">{items.map((area, index) => <div className="flex items-center gap-3" key={`${area}-${index}`}><span className="w-6 text-center text-sm font-semibold text-orange-300">{index + 1}</span><input aria-label={`Area ${index + 1}`} className="field min-w-0 flex-1 px-3 py-2" onChange={(event) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} value={area} /><button aria-label={`Remove ${area}`} className="rounded-md p-2 text-red-400 hover:bg-red-950 disabled:text-zinc-600" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button"><Trash2 size={18} /></button></div>)}</div><div className="mt-5 flex flex-wrap items-center gap-3"><button className="button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm" onClick={() => setItems((current) => [...current, "New area"])} type="button"><Plus size={16} /> Add area</button><button className="button-orange inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-60" disabled={pending} type="submit"><Save size={16} /> {pending ? "Saving..." : "Save areas"}</button>{state.error ? <p aria-live="polite" className="text-sm text-red-300">{state.error}</p> : null}{state.message ? <p aria-live="polite" className="text-sm text-green-300">{state.message}</p> : null}</div><p className="mt-3 text-sm text-zinc-400">Move or delete every task in an area before removing that area.</p></form></details>;
}
