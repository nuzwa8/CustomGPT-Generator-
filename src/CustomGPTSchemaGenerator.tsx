import React, { useMemo, useState, useEffect } from "react";

/** Types */
type BuiltInTool = "web" | "code" | "retrieval" | "image" | "vision";
type CustomAction = {
  name: string;
  description?: string;
  type: "openapi" | "json-rpc" | "graphql" | "webhook";
  specUrlOrInline?: string;
  auth?: { type: "none" | "api_key" | "oauth2"; instructions?: string };
  rateLimitPerMinute?: number;
  allowedDomains?: string[];
};
type MemoryPolicy = { enabled: boolean; scope?: "conversation" | "user"; dataRetentionDays?: number };
type SafetyPolicy = { jailbreakDefense?: boolean; blockDisallowedContent?: boolean; piiRedaction?: boolean; customDisallowedPhrases?: string[] };
type ConversationStarter = { title: string; prompt: string };
type PersonaStyle = {
  writingTone?: "casual" | "formal" | "technical" | "friendly" | "playful" | "neutral";
  emojiUse?: "none" | "light" | "moderate" | "heavy";
  responseLength?: "short" | "medium" | "long";
};
type CustomGPTConfig = {
  schemaVersion: string;
  name: string;
  description?: string;
  instructions: string;
  language?: string;
  persona?: PersonaStyle;
  builtInTools?: BuiltInTool[];
  customActions?: CustomAction[];
  knowledge?: { enabled: boolean; documents?: string[] };
  memory?: MemoryPolicy;
  safety?: SafetyPolicy;
  conversationStarters?: ConversationStarter[];
  sampleQuestions?: string[];
  tags?: string[];
  createdAt?: string;
};

/** Defaults */
const defaultConfig: CustomGPTConfig = {
  schemaVersion: "1.0",
  name: "Untitled Custom GPT",
  description: "",
  instructions: "You are a helpful assistant.",
  language: "en",
  persona: { writingTone: "friendly", emojiUse: "light", responseLength: "medium" },
  builtInTools: ["web"],
  customActions: [],
  knowledge: { enabled: false, documents: [] },
  memory: { enabled: false, scope: "user", dataRetentionDays: 180 },
  safety: { jailbreakDefense: true, blockDisallowedContent: true, piiRedaction: false, customDisallowedPhrases: [] },
  conversationStarters: [{ title: "What can you do?", prompt: "Give me a quick overview of your abilities." }],
  sampleQuestions: ["How do I get started?"],
  tags: ["starter"],
  createdAt: new Date().toISOString(),
};

/** UI atoms */
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[13px] font-medium text-gray-700">{children}</label>;
}
function TextArea({ label, value, onChange, rows = 6, placeholder }:
  { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <textarea
        className="w-full rounded-2xl border border-gray-200 p-3 text-[15px] leading-6 focus:outline-none focus:ring-2 focus:ring-gray-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
}
function Input({ label, value, onChange, placeholder, type = "text", inputMode }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <input
        className="w-full rounded-2xl border border-gray-200 p-3 text-[15px] leading-6 focus:outline-none focus:ring-2 focus:ring-gray-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
      />
    </div>
  );
}
function Toggle({ label, checked, onChange }:{ label: string; checked: boolean; onChange: (v: boolean)=>void; }){
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input className="h-5 w-5 accent-black" type="checkbox" checked={checked} onChange={(e)=>onChange(e.target.checked)} />
      <span className="text-[14px]">{label}</span>
    </label>
  );
}
function Pill({ text, onRemove }:{ text: string; onRemove?: ()=>void; }){
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-[12px]">
      {text}
      {onRemove && <button onClick={onRemove} className="opacity-60 hover:opacity-100" aria-label="Remove">×</button>}
    </span>
  );
}
function Section({ title, children, defaultOpen = false, hint }:
  { title: string; children: React.ReactNode; defaultOpen?: boolean; hint?: string; }) {
  return (
    <details className="rounded-2xl border border-gray-200 bg-white open:shadow-sm" open={defaultOpen}>
      <summary className="list-none cursor-pointer select-none px-4 py-3 text-[15px] font-semibold flex items-center justify-between">
        <span>{title}</span>
        {hint && <span className="text-xs text-gray-500">{hint}</span>}
      </summary>
      <div className="p-4 pt-0">
        <div className="h-px bg-gray-100 mb-4" />
        {children}
      </div>
    </details>
  );
}
function Toast({ show, text }:{ show:boolean; text:string }){
  return (
    <div className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 transform rounded-full bg-black px-4 py-2 text-white text-sm transition-opacity ${show ? "opacity-100" : "opacity-0"}`} role="status" aria-live="polite">
      {text}
    </div>
  );
}

/** Main component */
export default function CustomGPTSchemaGenerator(){
  const [cfg] = useState<CustomGPTConfig>({ ...defaultConfig });

  // Basic
  const [name, setName] = useState(cfg.name);
  const [description, setDescription] = useState(cfg.description || "");
  const [instructions, setInstructions] = useState(cfg.instructions);
  const [language, setLanguage] = useState(cfg.language || "en");

  // Persona
  const [tone, setTone] = useState(cfg.persona?.writingTone || "friendly");
  const [emoji, setEmoji] = useState(cfg.persona?.emojiUse || "light");
  const [lengthPref, setLengthPref] = useState(cfg.persona?.responseLength || "medium");

  // Tools
  const [toolWeb, setToolWeb] = useState(cfg.builtInTools?.includes("web") || false);
  const [toolCode, setToolCode] = useState(cfg.builtInTools?.includes("code") || false);
  const [toolRetrieval, setToolRetrieval] = useState(cfg.builtInTools?.includes("retrieval") || false);
  const [toolImage, setToolImage] = useState(cfg.builtInTools?.includes("image") || false);
  const [toolVision, setToolVision] = useState(cfg.builtInTools?.includes("vision") || false);

  // Custom actions
  const [actions, setActions] = useState<CustomAction[]>(cfg.customActions || []);
  const [actionDraft, setActionDraft] = useState<CustomAction>({ name: "", type: "openapi", specUrlOrInline: "" });

  // Knowledge
  const [knowledgeEnabled, setKnowledgeEnabled] = useState(cfg.knowledge?.enabled || false);
  const [knowledgeDocs, setKnowledgeDocs] = useState<string[]>(cfg.knowledge?.documents || []);
  const [docDraft, setDocDraft] = useState("");

  // Memory & safety
  const [memoryEnabled, setMemoryEnabled] = useState(cfg.memory?.enabled || false);
  const [memoryScope, setMemoryScope] = useState(cfg.memory?.scope || "user");
  const [retention, setRetention] = useState(String(cfg.memory?.dataRetentionDays || 180));
  const [jailbreakDefense, setJailbreakDefense] = useState(!!cfg.safety?.jailbreakDefense);
  const [blockDisallowed, setBlockDisallowed] = useState(!!cfg.safety?.blockDisallowedContent);
  const [piiRedaction, setPiiRedaction] = useState(!!cfg.safety?.piiRedaction);
  const [customPhrases, setCustomPhrases] = useState<string[]>(cfg.safety?.customDisallowedPhrases || []);
  const [phraseDraft, setPhraseDraft] = useState("");

  // UX polish
  const [starters, setStarters] = useState<ConversationStarter[]>(cfg.conversationStarters || []);
  const [starterTitle, setStarterTitle] = useState("");
  const [starterPrompt, setStarterPrompt] = useState("");
  const [sampleQs, setSampleQs] = useState<string[]>(cfg.sampleQuestions || []);
  const [sampleDraft, setSampleDraft] = useState("");
  const [tags, setTags] = useState<string[]>(cfg.tags || []);
  const [tagDraft, setTagDraft] = useState("");

  // Toast
  const [copied, setCopied] = useState(false);
  useEffect(()=>{ if(!copied) return; const t=setTimeout(()=>setCopied(false),1200); return ()=>clearTimeout(t); },[copied]);

  // Derived JSON
  const output = useMemo<CustomGPTConfig>(() => {
    const builtIn: BuiltInTool[] = [];
    if (toolWeb) builtIn.push("web");
    if (toolCode) builtIn.push("code");
    if (toolRetrieval) builtIn.push("retrieval");
    if (toolImage) builtIn.push("image");
    if (toolVision) builtIn.push("vision");
    return {
      schemaVersion: "1.0",
      name, description, instructions, language,
      persona: { writingTone: tone as PersonaStyle["writingTone"], emojiUse: emoji as PersonaStyle["emojiUse"], responseLength: lengthPref as PersonaStyle["responseLength"] },
      builtInTools: builtIn,
      customActions: actions,
      knowledge: { enabled: knowledgeEnabled, documents: knowledgeDocs },
      memory: { enabled: memoryEnabled, scope: memoryScope as MemoryPolicy["scope"], dataRetentionDays: Math.max(0, Number(retention) || 0) },
      safety: { jailbreakDefense, blockDisallowedContent: blockDisallowed, piiRedaction, customDisallowedPhrases: customPhrases },
      conversationStarters: starters,
      sampleQuestions: sampleQs,
      tags,
      createdAt: new Date().toISOString(),
    };
  }, [name, description, instructions, language, tone, emoji, lengthPref, toolWeb, toolCode, toolRetrieval, toolImage, toolVision, actions, knowledgeEnabled, knowledgeDocs, memoryEnabled, memoryScope, retention, jailbreakDefense, blockDisallowed, piiRedaction, customPhrases, starters, sampleQs, tags]);

  // Mutators
  function addAction(){ if(!actionDraft.name.trim()) return; setActions(prev=>[...prev, actionDraft]); setActionDraft({ name: "", type: "openapi", specUrlOrInline: "" }); }
  function removeAction(i:number){ setActions(prev=>prev.filter((_,idx)=>idx!==i)); }
  function addDoc(){ if(!docDraft.trim()) return; setKnowledgeDocs(p=>[...p, docDraft.trim()]); setDocDraft(""); }
  function removeDoc(i:number){ setKnowledgeDocs(p=>p.filter((_,idx)=>idx!==i)); }
  function addPhrase(){ if(!phraseDraft.trim()) return; setCustomPhrases(p=>[...p, phraseDraft.trim()]); setPhraseDraft(""); }
  function removePhrase(i:number){ setCustomPhrases(p=>p.filter((_,idx)=>idx!==i)); }
  function addStarter(){ if(!starterTitle.trim() || !starterPrompt.trim()) return; setStarters(s=>[...s,{title:starterTitle.trim(),prompt:starterPrompt.trim()}]); setStarterTitle(""); setStarterPrompt(""); }
  function removeStarter(i:number){ setStarters(s=>s.filter((_,idx)=>idx!==i)); }
  function addSample(){ if(!sampleDraft.trim()) return; setSampleQs(s=>[...s, sampleDraft.trim()]); setSampleDraft(""); }
  function removeSample(i:number){ setSampleQs(s=>s.filter((_,idx)=>idx!==i)); }
  function addTag(){ if(!tagDraft.trim()) return; setTags(t=>[...t, tagDraft.trim()]); setTagDraft(""); }
  function removeTag(i:number){ setTags(t=>t.filter((_,idx)=>idx!==i)); }
  async function copyJSON(){ await navigator.clipboard.writeText(JSON.stringify(output,null,2)); setCopied(true); }
  function downloadJSON(){ const blob=new Blob([JSON.stringify(output,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`${name || "custom-gpt"}.json`; a.click(); URL.revokeObjectURL(url); }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast show={copied} text="Copied ✓" />
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl sm:text-2xl font-semibold">Custom GPT Schema Generator</h1>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <button onClick={copyJSON} className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:shadow active:scale-[0.98]">Copy JSON</button>
              <button onClick={downloadJSON} className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:shadow active:scale-[0.98]">Download JSON</button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 space-y-5">
        <Section title="Basic" defaultOpen hint="Name, language, description, instructions">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Name" value={name} onChange={setName} placeholder="e.g., EduAssess Pro" />
            <Input label="Language (IETF tag)" value={language} onChange={setLanguage} placeholder="e.g., en, ur, en-GB" />
            <div className="md:col-span-2">
              <Input label="Short Description" value={description} onChange={setDescription} placeholder="One-line purpose" />
            </div>
            <div className="md:col-span-2">
              <TextArea label="System Instructions" value={instructions} onChange={setInstructions} rows={8} placeholder="Define role, constraints, formatting rules, and tool-use strategy." />
            </div>
          </div>
        </Section>

        <Section title="Persona & Style" hint="Tone, emoji, response length">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Tone</Label>
              <select className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-300" value={tone} onChange={(e)=>setTone(e.target.value)}>
                <option value="casual">casual</option><option value="formal">formal</option><option value="technical">technical</option><option value="friendly">friendly</option><option value="playful">playful</option><option value="neutral">neutral</option>
              </select>
            </div>
            <div>
              <Label>Emoji Use</Label>
              <select className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-300" value={emoji} onChange={(e)=>setEmoji(e.target.value)}>
                <option value="none">none</option><option value="light">light</option><option value="moderate">moderate</option><option value="heavy">heavy</option>
              </select>
            </div>
            <div>
              <Label>Response Length</Label>
              <select className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-300" value={lengthPref} onChange={(e)=>setLengthPref(e.target.value)}>
                <option value="short">short</option><option value="medium">medium</option><option value="long">long</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Built-in Tools & Custom Actions" hint="web, code, retrieval, image, vision + APIs">
          <div className="flex flex-wrap gap-4">
            <Toggle label="Web Browsing" checked={toolWeb} onChange={setToolWeb} />
            <Toggle label="Code Interpreter" checked={toolCode} onChange={setToolCode} />
            <Toggle label="Retrieval / RAG" checked={toolRetrieval} onChange={setToolRetrieval} />
            <Toggle label="Image Generation" checked={toolImage} onChange={setToolImage} />
            <Toggle label="Vision (image understanding)" checked={toolVision} onChange={setToolVision} />
          </div>

          <div className="pt-4 space-y-3">
            <h3 className="text-[14px] font-semibold">Custom Actions</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <Input label="Name" value={actionDraft.name} onChange={(v)=>setActionDraft(a=>({...a,name:v}))} />
              <div>
                <Label>Type</Label>
                <select className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-300" value={actionDraft.type} onChange={(e)=>setActionDraft(a=>({...a, type: e.target.value as CustomAction["type"]}))}>
                  <option value="openapi">openapi</option><option value="json-rpc">json-rpc</option><option value="graphql">graphql</option><option value="webhook">webhook</option>
                </select>
              </div>
              <Input label="Spec URL or Inline" value={actionDraft.specUrlOrInline || ""} onChange={(v)=>setActionDraft(a=>({...a, specUrlOrInline:v}))} placeholder="https://... or raw spec" />
              <div>
                <Label>Auth</Label>
                <select className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-300" value={actionDraft.auth?.type || "none"} onChange={(e)=>setActionDraft(a=>({...a, auth: { ...(a.auth||{}), type: e.target.value as any }}))}>
                  <option value="none">none</option><option value="api_key">api_key</option><option value="oauth2">oauth2</option>
                </select>
              </div>
              <Input label="Auth Instructions (optional)" value={actionDraft.auth?.instructions || ""} onChange={(v)=>setActionDraft(a=>({...a, auth: { ...(a.auth||{ type: "none" }), instructions:v }}))} placeholder="Header, OAuth steps, etc." />
            </div>
            <div className="flex justify-end pt-1">
              <button onClick={addAction} className="w-full sm:w-auto rounded-xl border border-gray-300 px-4 py-2 text-sm hover:shadow active:scale-[0.98]">Add Action</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map((a, i)=>(
                <div key={i} className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
                  <span className="font-medium">{a.name}</span>
                  <span className="opacity-70">{a.type}</span>
                  {a.specUrlOrInline && <span className="opacity-70">• spec</span>}
                  <button onClick={()=>removeAction(i)} className="opacity-60 hover:opacity-100">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Knowledge / RAG" hint="Attach doc names (hints only)">
          <div className="space-y-2">
            <Toggle label="Enable knowledge retrieval" checked={knowledgeEnabled} onChange={setKnowledgeEnabled} />
            {knowledgeEnabled && (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input className="flex-1 rounded-2xl border border-gray-200 p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-300" placeholder="e.g., Pricing Deck v3.pdf" value={docDraft} onChange={(e)=>setDocDraft(e.target.value)} />
                  <button onClick={addDoc} className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:shadow active:scale-[0.98]">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {knowledgeDocs.map((d,i)=>(<Pill key={i} text={d} onRemove={()=>removeDoc(i)} />))}
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title="Memory & Safety" hint="Retention, PII, jailbreak">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Toggle label="Enable persistent memory" checked={memoryEnabled} onChange={setMemoryEnabled} />
              {memoryEnabled && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <Label>Scope</Label>
                    <select className="mt-2 w-full rounded-2xl border border-gray-200 p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-300" value={memoryScope} onChange={(e)=>setMemoryScope(e.target.value)}>
                      <option value="conversation">conversation</option>
                      <option value="user">user</option>
                    </select>
                  </div>
                  <Input label="Retention Days" value={retention} onChange={setRetention} type="number" inputMode="numeric" placeholder="e.g., 180" />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <Toggle label="Jailbreak defense" checked={jailbreakDefense} onChange={setJailbreakDefense} />
              <Toggle label="Block disallowed content" checked={blockDisallowed} onChange={setBlockDisallowed} />
              <Toggle label="PII redaction" checked={piiRedaction} onChange={setPiiRedaction} />
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input className="flex-1 rounded-2xl border border-gray-200 p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-300" placeholder="Add custom disallowed phrase" value={phraseDraft} onChange={(e)=>setPhraseDraft(e.target.value)} />
                  <button onClick={addPhrase} className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:shadow active:scale-[0.98]">Add</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {customPhrases.map((p,i)=>(<Pill key={i} text={p} onRemove={()=>removePhrase(i)} />))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Conversation Starters & Hints" hint="Starters, sample Qs, tags">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Starter Title" value={starterTitle} onChange={setStarterTitle} />
            <Input label="Starter Prompt" value={starterPrompt} onChange={setStarterPrompt} />
          </div>
          <div className="flex justify-end">
            <button onClick={addStarter} className="w-full sm:w-auto rounded-xl border border-gray-300 px-4 py-2 text-sm hover:shadow active:scale-[0.98]">Add Starter</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {starters.map((s,i)=>(
              <div key={i} className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
                <span className="font-medium">{s.title}</span>
                <span className="opacity-70">— {s.prompt}</span>
                <button onClick={()=>removeStarter(i)} className="opacity-60 hover:opacity-100">Remove</button>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input className="flex-1 rounded-2xl border border-gray-200 p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-300" placeholder="Sample question…" value={sampleDraft} onChange={(e)=>setSampleDraft(e.target.value)} />
              <button onClick={addSample} className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:shadow active:scale-[0.98]">Add</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {sampleQs.map((q,i)=>(<Pill key={i} text={q} onRemove={()=>removeSample(i)} />))}
            </div>
          </div>

          <div className="pt-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input className="flex-1 rounded-2xl border border-gray-200 p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-300" placeholder="Add tag…" value={tagDraft} onChange={(e)=>setTagDraft(e.target.value)} />
              <button onClick={addTag} className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:shadow active:scale-[0.98]">Add</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t,i)=>(<Pill key={i} text={t} onRemove={()=>removeTag(i)} />))}
            </div>
          </div>
        </Section>

        <Section title="Generated Schema (JSON)" defaultOpen hint="Live preview">
          <div className="rounded-2xl border border-gray-200 bg-white">
            <pre className="max-h-[50vh] overflow-auto p-4 text-[13px] leading-6">
{JSON.stringify(output, null, 2)}
            </pre>
          </div>
          <p className="mt-2 text-xs text-gray-500">Tip: Use “Copy JSON” or “Download JSON” above. Convert to YAML externally if needed.</p>
        </Section>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-gray-200 bg-white/90 backdrop-blur px-4 py-2 sm:hidden">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={copyJSON} className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:shadow active:scale-[0.98]">Copy</button>
          <button onClick={downloadJSON} className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:shadow active:scale-[0.98]">Download</button>
        </div>
      </div>
    </div>
  );
}
