import {useRef,useState} from 'react';import {motion,AnimatePresence} from 'framer-motion';
import {analyze,buildDoc,CATS,Case,I18N,listen,ocr,pdf,useStore,Engine,PORTALS,CHECK,dueInfo,followUp,SPEECH,ttsLang,detectLang} from './lib';
const TABS:[string,string][]=[['home','🏠'],['talk','🎙️'],['dash','📊'],['cases','📁']];
const FILTERS=['All','Civic','Consumer','RTI','Legal','Insurance'];
const DEMO_SPEECH='Mujhe Ahmedabad mein Naroda road pe sadak ki shikayat karni hai, um, paani bhar raha hai aur log phisal rahe hain, jaldi repair chahiye';
export default function App(){
  const {cases,set}=useStore();const t=I18N.en;
  const [view,setView]=useState<'home'|'talk'|'dash'|'cases'>('home');
  const [lang,setLang]=useState('hinglish');const [rec,setRec]=useState(false);const [level,setLevel]=useState(0);
  const [raw,setRaw]=useState('');const [engine,setEngine]=useState<Engine|''>('');const [cur,setCur]=useState<Case|null>(null);
  const [ocrOut,setOcrOut]=useState<any>(null);const [filter,setFilter]=useState('All');const [open,setOpen]=useState<string>('');const [msg,setMsg]=useState('');
  const stopRef=useRef<()=>void>();
  const clean=(s:string)=>{const c=s.replace(/\b(um+|uh+|hmm+|matlab|like)\b,?\s*/gi,'').replace(/\s+/g,' ').trim();return c?c[0].toUpperCase()+c.slice(1)+(/[.!?]$/.test(c)?'':'.'):''};
  const save=(c:Case)=>{set([c,...cases.filter(x=>x.id!==c.id)]);setCur(c)};
  const update=(c:Case,patch:Partial<Case>)=>{const n={...c,...patch};set(cases.map(x=>x.id===c.id?n:x));setCur(n);return n};
  const build=(text:string,ev=0)=>{const cl=clean(text),a=analyze(cl);setMsg(a.miss);
    const c:Case={id:Math.random().toString(36).slice(2,8),title:`${CATS[a.cat].label} – ${a.fields.Location||'new'}`,category:a.cat,status:'Draft',lang:lang==='auto'?detectLang(text):lang,date:new Date().toLocaleDateString('en-IN'),confidence:a.confidence,evidence:ev,raw:text,clean:cl,fields:a.fields,doc:buildDoc(a.cat,a.fields,cl),timeline:['Created from voice','Document generated']};save(c)};
  // voice commands: every one also has a visible button
  const command=(s:string):boolean=>{const l=s.toLowerCase();
    if(/latest|naya|recent/.test(l)&&/open|kholo/.test(l)){setView('cases');setOpen(cases[0]?.id||'');return true}
    const f=FILTERS.find(f=>f!=='All'&&l.includes(f.toLowerCase()));if(/show|dikhao/.test(l)&&f){setFilter(f);setView('cases');return true}
    if(/submitted/.test(l)&&cur){update(cur,{status:'Submitted',timeline:[...cur.timeline,'Marked submitted']});return true}
    if(/pdf/.test(l)&&(cur||cases[0])){pdf(cur||cases[0]);return true}
    const sub=s.match(/subject.*?(?:change karo|badlo|change)\s*:?\s*(.+)/i);if(sub&&cur){update(cur,{doc:buildDoc(cur.category,cur.fields,cur.clean,sub[1].trim())});return true}
    if(/invoice number/.test(l)&&ocrOut?.fields['Invoice number']&&cur){update(cur,{doc:cur.doc.replace('SUPPORTING EVIDENCE\n','SUPPORTING EVIDENCE\nInvoice No: '+ocrOut.fields['Invoice number']+'\n')});return true}
    return false};
  const toggle=async()=>{
    if(rec){stopRef.current?.();setRec(false);setLevel(0);return}
    setRaw('');setCur(null);setRec(true);
    stopRef.current=await listen(lang,(txt,fin)=>{setRaw(txt);if(fin){setRec(false);if(!command(txt))build(txt)}},setLevel,setEngine)};
  const runDemo=()=>{setView('talk');setCur(null);setRaw('');setRec(true);setEngine('');const w=DEMO_SPEECH.split(' ');let i=0;
    const id=setInterval(()=>{setLevel(Math.random());setRaw(w.slice(0,++i).join(' '));if(i>=w.length){clearInterval(id);setRec(false);setLevel(0);
      const a=analyze(clean(DEMO_SPEECH));build(DEMO_SPEECH,0);
      setTimeout(()=>{setOcrOut({text:'MetroTiles Pvt Ltd\nInvoice No: INV-20458\nDate: 12/10/2026\nTotal: 3,450.00',fields:{'Invoice number':'INV-20458',Date:'12/10/2026',Vendor:'MetroTiles Pvt Ltd',Amount:'3,450.00'}})},900)}},170)};
  const onFile=async(f?:File)=>{if(!f)return;setMsg('Reading document…');const o=await ocr(f);setOcrOut(o);setMsg('');if(cur)update(cur,{evidence:cur.evidence+1})};
  const shown=cases.filter(c=>filter==='All'||CATS[c.category].filter===filter);
  const share=(c:Case)=>`*${c.title}*\n${c.clean}\nAuthority: ${c.fields.Authority}\nAsk: ${c.fields.Outcome}`;
  const bars=Array.from({length:24});
  return <div className="min-h-screen">
    <div className="blob w-96 h-96 bg-violet -top-20 -left-20"/><div className="blob w-96 h-96 bg-teal top-1/2 right-0" style={{animationDelay:'-6s'}}/><div className="blob w-80 h-80 bg-volt bottom-0 left-1/3" style={{animationDelay:'-11s'}}/>
    <header className="flex flex-wrap items-center justify-between gap-3 p-4 max-w-5xl mx-auto">
      <button onClick={()=>setView('home')} className="text-2xl font-extrabold" aria-label="Vaani home">Vaani</button>
      <nav className="flex gap-2 items-center" aria-label="Main">
        
        </nav></header>
    <div role="tablist" aria-label="Sections" className="max-w-5xl mx-auto px-4 flex gap-2 overflow-x-auto sticky top-0 z-10 py-2">{TABS.map(([k,l])=><button key={k} role="tab" aria-selected={view===k} onClick={()=>setView(k as any)} className={'btn whitespace-nowrap '+(view===k?'!bg-violet/50 !border-violet':'')}>{l} {t[k==='talk'?'speak':k]}</button>)}</div>
    <main className="max-w-5xl mx-auto p-4 pb-24">
    <AnimatePresence mode="wait"><motion.div key={view} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
    {view==='home'&&<section className="text-center py-10">
      <button onClick={()=>setView('talk')} aria-label={t.start} className="orb w-40 h-40 rounded-full mx-auto grid place-items-center text-6xl relative">🎙️<span className="absolute inset-0 rounded-full border border-white/40 ring"/></button>
      <h1 className="text-4xl md:text-6xl font-extrabold mt-8 max-w-3xl mx-auto leading-tight">{t.h}</h1>
      <p className="text-lg text-slate-300 mt-4 max-w-2xl mx-auto">{t.s}</p>
      <div className="flex gap-3 justify-center mt-8 flex-wrap"><button className="btn-amber" onClick={()=>setView('talk')}>{t.start}</button><button className="btn" onClick={runDemo}>{t.demo}</button></div>
      <p className="glass p-4 mt-12 text-left max-w-2xl mx-auto text-sm"><b>Privacy:</b> audio is used only to create the document you ask for. You can delete any case or all data at any time.</p></section>}
    {view==='talk'&&<section className="grid gap-5">
      <div className="glass p-6 text-center">
        <div className="relative w-36 h-36 mx-auto">{rec&&<span className="absolute inset-0 rounded-full bg-violet/40 ring"/>}
          <button onClick={toggle} aria-pressed={rec} aria-label={rec?'Stop recording':'Start recording'} className="orb relative w-36 h-36 rounded-full text-5xl">{rec?'⏹':'🎙️'}</button></div>
        <div className="flex justify-center items-end gap-1 h-12 mt-4" aria-hidden>{bars.map((_,i)=><motion.span key={i} className="w-1.5 rounded bg-teal" animate={{height:rec?6+level*40*Math.abs(Math.sin(i+level*9)):4}}/>)}</div>
        <p className="mt-2 text-slate-300">{t.tap}</p>
        <label className="block mt-3">Language <select value={lang} onChange={e=>setLang(e.target.value)}>{SPEECH.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <p className="text-xs text-slate-400 mt-1">Auto-detect picks the language from what you say. With the browser fallback, choose your language for best accuracy.</p>
        <p className="mt-3 text-sm"><span className="px-3 py-1 rounded-full bg-teal/20 border border-teal/40">Powered by Wispr Flow</span>
          {engine==='fallback'&&<span className="ml-2 px-3 py-1 rounded-full bg-amber/20 border border-amber/50">Fallback: browser speech recognition (not Wispr Flow)</span>}
          {engine==='wispr'&&<span className="ml-2 text-teal">● Live with Wispr Flow</span>}</p>
        <details className="mt-3 text-left text-sm text-slate-300"><summary className="cursor-pointer">How Vaani hears you</summary>Your raw speech streams to Wispr Flow, which removes filler words, adds punctuation, handles Hindi/English/Gujarati mixes and gets names right. Vaani then turns the clean text into structured fields and a ready document. Without Wispr credentials Vaani uses your browser's speech recognition and says so.</details>
        <div className="mt-4"><textarea aria-label="Type instead" className="w-full p-3" rows={2} placeholder="Or type your problem here…" value={rec?'':raw} onChange={e=>setRaw(e.target.value)}/>
          <button className="btn mt-2" onClick={()=>raw&&(command(raw)||build(raw))}>Use typed text</button></div></div>
      {raw&&<div className="grid md:grid-cols-2 gap-4"><div className="glass p-4"><h3 className="font-bold">Raw spoken input</h3><p className="text-slate-300">{raw}</p></div>
        <div className="glass p-4"><h3 className="font-bold text-teal">Cleaned transcript</h3><p>{clean(raw)}</p><p className="text-xs text-teal mt-2">Detected language: {SPEECH.find(x=>x[0]===(lang==='auto'?detectLang(raw):lang))?.[1]}</p></div></div>}
      {msg&&<div role="status" className="glass p-4 border-amber/60">🗣️ {msg} <span className="text-slate-400">(answer by speaking or typing above)</span></div>}
      {cur&&<>
      <div className="glass p-5"><h2 className="text-xl font-bold mb-1">{CATS[cur.category].icon} {CATS[cur.category].label} · {cur.confidence}% confidence</h2><p className="text-sm text-slate-400 mb-3">Everything is editable.</p>
        <div className="grid sm:grid-cols-2 gap-3">{Object.entries(cur.fields).map(([k,v])=><label key={k} className="block text-sm">{k}<input className="w-full mt-1 text-base" value={v} placeholder="Missing – add" onChange={e=>{const f={...cur.fields,[k]:e.target.value};update(cur,{fields:f,doc:buildDoc(cur.category,f,cur.clean)})}}/></label>)}</div></div>
      <div className="glass p-5"><h2 className="text-xl font-bold mb-2">Your document</h2>
        <textarea aria-label="Document" className="w-full p-3 font-mono text-sm" rows={16} value={cur.doc} onChange={e=>update(cur,{doc:e.target.value})}/>
        <div className="flex flex-wrap gap-2 mt-3"><button className="btn-amber" onClick={()=>pdf(cur)}>Download PDF</button>
          <button className="btn" onClick={()=>navigator.clipboard.writeText(cur.doc)}>Copy text</button>
          <a className="btn" href={`mailto:?subject=${encodeURIComponent(cur.title)}&body=${encodeURIComponent(cur.doc)}`}>Email draft</a>
          <a className="btn" target="_blank" rel="noreferrer" href={'https://wa.me/?text='+encodeURIComponent(share(cur))}>WhatsApp summary</a></div></div>
      <Extras c={cur} onFollow={()=>{const n=update(cur,{doc:followUp(cur),status:'Follow-up Needed',timeline:[...cur.timeline,'Follow-up letter drafted']})}}/>
      <div className="glass p-5"><h2 className="text-xl font-bold mb-2">Evidence (photo, bill, ID)</h2>
        <input type="file" accept="image/*" aria-label="Upload evidence" onChange={e=>onFile(e.target.files?.[0])}/>
        {ocrOut&&<div className="grid sm:grid-cols-2 gap-3 mt-3"><pre className="whitespace-pre-wrap text-sm bg-black/30 p-3 rounded-xl">{ocrOut.text}</pre>
          <div>{Object.entries(ocrOut.fields).map(([k,v]:any)=><p key={k}><b>{k}:</b> {v||'—'}</p>)}
            <button className="btn mt-2" onClick={()=>command('invoice number use karo')||update(cur,{doc:cur.doc.replace('SUPPORTING EVIDENCE\n',`SUPPORTING EVIDENCE\nInvoice No: ${ocrOut.fields['Invoice number']}, Vendor: ${ocrOut.fields.Vendor}\n`)})}>Use invoice details in document</button></div></div>}</div>
      <button className="btn-amber justify-self-start" onClick={()=>{update(cur,{status:'Ready to Submit'});setView('cases')}}>Save to dashboard</button></>}
    </section>}
    {view==='dash'&&<section className="grid gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{['Draft','Ready to Submit','Submitted','Follow-up Needed'].map(st=><button key={st} className="glass p-4 text-left" onClick={()=>setView('cases')}><p className="text-3xl font-extrabold">{cases.filter(c=>c.status===st).length}</p><p className="text-sm text-slate-300">{st}</p></button>)}</div>
      <div className="glass p-5"><h2 className="text-xl font-bold mb-2">Follow-ups coming up</h2>
        {cases.filter(c=>c.status==='Submitted'||c.status==='Follow-up Needed').sort((a,b)=>dueInfo(a).left-dueInfo(b).left).map(c=>{const d=dueInfo(c);return <p key={c.id} className="py-1">{CATS[c.category].icon} {c.title} – <b className={d.left<0?'text-amber':''}>{d.left<0?`overdue by ${-d.left} days`:`due in ${d.left} days`}</b> ({d.on})</p>})}
        {!cases.some(c=>c.status==='Submitted'||c.status==='Follow-up Needed')&&<p className="text-slate-400">Nothing to follow up yet. Mark a case as submitted to start the reminder clock.</p>}</div>
      <button className="btn-amber justify-self-start" onClick={()=>setView('talk')}>🎙️ New complaint</button></section>}
    {view==='cases'&&<section className="grid gap-4">
      <div className="flex flex-wrap gap-2 items-center">{FILTERS.map(f=><button key={f} aria-pressed={filter===f} className={'btn '+(filter===f?'!bg-violet/40':'')} onClick={()=>setFilter(f)}>{f}</button>)}
        <button className="btn-amber ml-auto" onClick={()=>setView('talk')}>🎙️ New complaint</button></div>
      {!shown.length&&<p className="glass p-6">No cases here yet. Press the microphone to start one.</p>}
      {shown.map(c=><motion.article key={c.id} layout initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="glass p-5">
        <div className="flex flex-wrap justify-between gap-2"><h3 className="text-lg font-bold">{CATS[c.category].icon} {c.title}</h3>
          <motion.span key={c.status} initial={{scale:1.3}} animate={{scale:1}} className="px-3 py-1 rounded-full bg-amber/20 border border-amber/50 text-sm">{c.status}</motion.span></div>
        <p className="text-sm text-slate-300 mt-1">{SPEECH.find(x=>x[0]===c.lang)?.[1]||c.lang} · {c.date} · {c.confidence}% confidence · {c.evidence} evidence{(c.status==='Submitted'||c.status==='Follow-up Needed')&&` · follow-up ${dueInfo(c).left<0?'overdue':'in '+dueInfo(c).left+' days'}`}</p>
        <div className="flex flex-wrap gap-2 mt-3"><button className="btn" onClick={()=>setOpen(open===c.id?'':c.id)}>{open===c.id?'Hide':'Details & timeline'}</button>
          <button className="btn" onClick={()=>{setCur(c);setRaw(c.raw);setView('talk')}}>Edit</button>
          <button className="btn" onClick={()=>pdf(c)}>PDF</button>
          <button className="btn" onClick={()=>{setCur(c);update(c,{status:'Submitted',timeline:[...c.timeline,'Marked submitted']})}}>Mark submitted</button>
          <button className="btn" onClick={()=>confirm('Delete this case?')&&set(cases.filter(x=>x.id!==c.id))}>Delete</button></div>
        {open===c.id&&<div className="mt-4 grid md:grid-cols-2 gap-4 text-sm"><div><p className="text-slate-400">Original</p><p>{c.raw}</p><p className="text-teal mt-2">Cleaned</p><p>{c.clean}</p><p className="mt-2">Next: {c.status==='Submitted'?'Follow up in 15 days':'Review and submit to '+c.fields.Authority}</p></div>
          <ol className="border-l border-white/20 pl-4 space-y-2">{c.timeline.map((x,i)=><li key={i}>{x}</li>)}</ol></div>}
        {open===c.id&&<Extras c={c} onFollow={()=>{update(c,{doc:followUp(c),status:'Follow-up Needed',timeline:[...c.timeline,'Follow-up letter drafted']});setCur(c);setView('talk')}}/>}
      </motion.article>)}
      <button className="btn justify-self-start" onClick={()=>confirm('Delete ALL cases and files?')&&(fetch('/api/cases',{method:'DELETE'}),set([]))}>Delete all my data</button>
    </section>}
    </motion.div></AnimatePresence></main></div>}

function Extras({c,onFollow}:{c:Case;onFollow:()=>void}){
  const [chk,setChk]=useState<Record<string,boolean>>({});const p=PORTALS[c.category];const d=dueInfo(c);
  const speak=()=>{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(c.doc);u.lang=ttsLang(c.doc);speechSynthesis.speak(u)};
  return <div className="glass p-5 mt-3 grid gap-3"><h3 className="text-lg font-bold">Next steps</h3>
    <p>📅 Follow up by <b>{d.on}</b> if you hear nothing.</p>
    <p>🌐 Where to submit: <a className="underline text-teal" target="_blank" rel="noreferrer" href={p.url}>{p.name}</a><span className="block text-xs text-slate-400">Portals vary by state. Please verify before submitting.</span></p>
    <fieldset><legend className="font-semibold">Documents to attach</legend>{CHECK[c.category].map(i=><label key={i} className="flex gap-2 items-center py-1"><input type="checkbox" className="!min-h-0 w-5 h-5" checked={!!chk[i]} onChange={e=>setChk({...chk,[i]:e.target.checked})}/>{i}</label>)}</fieldset>
    <div className="flex flex-wrap gap-2"><button className="btn" onClick={speak}>🔊 Read aloud</button><button className="btn" onClick={()=>speechSynthesis.cancel()}>Stop</button><button className="btn" onClick={onFollow}>✉️ Draft follow-up letter</button></div></div>}
