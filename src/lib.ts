import {create} from 'zustand';import {jsPDF} from 'jspdf';
export type Case={id:string;title:string;category:string;status:string;lang:string;date:string;confidence:number;evidence:number;raw:string;clean:string;fields:Record<string,string>;doc:string;timeline:string[]};
export const CATS:Record<string,{label:string;icon:string;filter:string;auth:string}>={
civic:{label:'Municipal/civic complaint',icon:'🚧',filter:'Civic',auth:'Municipal Commissioner'},
consumer:{label:'Consumer complaint',icon:'🛒',filter:'Consumer',auth:'District Consumer Disputes Redressal Commission'},
rti:{label:'RTI request',icon:'📄',filter:'RTI',auth:'Public Information Officer (PIO)'},
rental:{label:'Rental/housing issue',icon:'🏠',filter:'Legal',auth:'Landlord / Rent Authority'},
legal:{label:'Legal notice draft',icon:'⚖️',filter:'Legal',auth:'Opposite Party'},
police:{label:'Police complaint draft',icon:'🛡️',filter:'Legal',auth:'Station House Officer'},
insurance:{label:'Insurance claim',icon:'☂️',filter:'Insurance',auth:'Insurance Ombudsman'},
custom:{label:'Custom document',icon:'✍️',filter:'Legal',auth:'Concerned Authority'}};
const RULES:[string,RegExp][]=[['rti',/\brti\b|right to information|jaankari|आरटीआई|माहितीचा अधिकार|தகவல் அறியும் உரிமை|ಮಾಹಿತಿ ಹಕ್ಕು|సమాచార హక్కు|വിവരാവകാശം|ਸੂਚਨਾ ਦਾ ਅਧਿਕਾਰ|তথ্যৰ অধিকাৰ|માહિતીનો અધિકાર/i],['rental',/deposit|landlord|kiraya|rent\b|makan malik|भाडे|किराया|डिपॉझिट|डिपॉजिट|வாடகை|ಬಾಡಿಗೆ|అద్దె|വാടക|ਕਿਰਾਇਆ|ভাড়া|ભાડું/i],['insurance',/insurance|claim|policy|bima|विमा|बीमा|காப்பீடு|ವಿಮೆ|బీమా|ഇൻഷുറൻസ്|ਬੀਮਾ|বীমা|વીમો/i],
['police',/police|fir\b|theft|chori|thana|पोलीस|पुलिस|காவல்|போலீஸ்|ಪೊಲೀಸ್|పోలీస్|പോലീസ്|ਪੁਲਿਸ|আৰক্ষী|પોલીસ/i],['consumer',/refund|seller|order|product|amazon|flipkart|defective|invoice|laptop|phone|warranty|रिफंड|ரீஃபண்ட்|ರೀಫಂಡ್|రీఫండ్|റീഫണ്ട്|ਰਿਫੰਡ|ৰিফাণ্ড|રિફંડ|वॉरंटी|ग्राहक/i],
['civic',/sadak|road|pothole|gutter|garbage|kachra|paani|water|streetlight|drain|waterlogg|सड़क|रस्ता|खड्डा|சாலை|குழி|ரோடு|ರಸ್ತೆ|ಗುಂಡಿ|రోడ్డు|గుంత|റോഡ്|കുഴി|ਸੜਕ|ਟੋਆ|ৰাস্তা|રસ્તો|ખાડો|कचरा|पाणी|पानी/i],['legal',/legal notice|notice bhej/i]];
const CITY=/(ahmedabad|surat|vadodara|rajkot|mumbai|delhi|pune|bengaluru|chennai|kolkata|gandhinagar)/i;
export function analyze(t:string){
  const cat=(RULES.find(([,r])=>r.test(t))||['custom'])[0];
  const amt=t.match(/(?:₹|rs\.?|rupees?)\s?([\d,]+)|([\d,]{3,})\s?(?:rupees?|rs|₹)/i);
  const loc=t.match(CITY)?.[1]||t.match(/(?:in|at|mein|me)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(?:area|mein|ke)/)?.[1]||'';
  const who=t.match(/(?:against|from|seller|shop|company)\s+([A-Z][\w&.]+(?:\s[A-Z][\w&.]+)?)/)?.[1]||'';
  const urgent=/urgent|jaldi|turant|accident|phisal|danger|emergency|immediately/i.test(t)?'High':'Normal';
  const outcome={civic:'Immediate repair and inspection',consumer:'Refund / replacement with compensation',rti:'Disclosure of requested records within 30 days',rental:'Full refund of security deposit',insurance:'Settlement of claim',police:'Registration of complaint',legal:'Compliance with notice',custom:'Appropriate action'}[cat];
  const fields={Issue:CATS[cat].label,Location:loc,'Date/time':new Date().toLocaleDateString('en-IN'),Authority:CATS[cat].auth,'Person/company':who,Amount:amt?'₹'+(amt[1]||amt[2]):'',Outcome:outcome,Urgency:urgent};
  const miss=!fields.Location?'Aapki shikayat kis area ya city se related hai?':!fields.Amount&&cat==='consumer'?'Kitni raashi involve hai?':'';
  const filled=Object.values(fields).filter(Boolean).length;
  return {cat,fields,miss,confidence:Math.round(40+filled*7)};
}
export function buildDoc(cat:string,f:Record<string,string>,clean:string,subject?:string){
  const s=subject||`${f.Issue} – ${f.Location||'location to be added'}`;
  return `Subject: ${s}\n\nTo,\n${f.Authority}\n${f.Location}\n\nRespected Sir/Madam,\n\nFACTS OF THE CASE\n${clean}\n\nTIMELINE\n- ${f['Date/time']}: Issue noticed and reported by the applicant.\n${f['Person/company']?`\nPARTY INVOLVED\n${f['Person/company']}\n`:''}${f.Amount?`\nAMOUNT INVOLVED\n${f.Amount}\n`:''}\nSUPPORTING EVIDENCE\nPhotographs / bills / documents attached (see annexures).\n\nREQUESTED ACTION\n${f.Outcome}. Urgency: ${f.Urgency}.\n\nApplicant details\nName: ____________   Phone: ____________\nDate: ${f['Date/time']}\n\nYours faithfully,\nApplicant`;
}
export function pdf(c:Case){const d=new jsPDF();d.setFontSize(11);d.text(d.splitTextToSize(c.doc,175),18,20);d.save(`vaani-${c.id}.pdf`)}
// Speech: Wispr Flow (live, if token) or clearly labeled Web Speech fallback
const wav=(pcm:Int16Array)=>{const b=new ArrayBuffer(44+pcm.length*2),v=new DataView(b),w=(o:number,s:string)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
  w(0,'RIFF');v.setUint32(4,36+pcm.length*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,16000,true);v.setUint32(28,32000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,pcm.length*2,true);
  new Int16Array(b,44).set(pcm);let s='';new Uint8Array(b).forEach(x=>s+=String.fromCharCode(x));return btoa(s)};
export type Engine='wispr'|'fallback';
export async function listen(lang:string,onText:(t:string,final:boolean)=>void,onLevel:(n:number)=>void,onEngine:(e:Engine)=>void){
  const tok=await fetch('/api/wispr/token',{method:'POST'}).then(r=>r.json()).catch(()=>({available:false}));
  if(tok.available){
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});const ctx=new AudioContext({sampleRate:16000});
    const src=ctx.createMediaStreamSource(stream),node=ctx.createScriptProcessor(8192,1,1);
    const ws=new WebSocket('wss://platform-api.wisprflow.ai/api/v1/dash/client_ws?client_key=Bearer%20'+tok.token);
    const q:any[]=[];let ready=false,pos=0,n=0,stopped=false;
    const send=(p:any)=>{ws.send(JSON.stringify({type:'append',position:pos,audio_packets:{packets:[p.a],volumes:[p.v],packet_duration:8192/16000,audio_encoding:'wav',byte_encoding:'base64'}}));pos++;n++};
    ws.onopen=()=>ws.send(JSON.stringify({type:'auth',access_token:tok.token,language:SPEECH.find(x=>x[0]===lang)?.[3],context:{app:{name:'Vaani',type:'other'}}}));
    ws.onmessage=e=>{const r=JSON.parse(e.data);if(r.status==='auth'){ready=true;q.splice(0).forEach(send);onEngine('wispr')}else if(r.status==='text')onText(r.body.text,!!r.final);else if(r.status==='error')onEngine('fallback')};
    node.onaudioprocess=e=>{const f=e.inputBuffer.getChannelData(0),pcm=new Int16Array(f.length);let m=0;f.forEach((x,i)=>{pcm[i]=Math.max(-1,Math.min(1,x))*32767;m=Math.max(m,Math.abs(x))});onLevel(m);const p={a:wav(pcm),v:m};ready?send(p):q.push(p)};
    src.connect(node);node.connect(ctx.destination);
    return ()=>{if(stopped)return;stopped=true;node.disconnect();stream.getTracks().forEach(t=>t.stop());ctx.close();if(ws.readyState===1)ws.send(JSON.stringify({type:'commit',total_packets:n}))};
  }
  const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;onEngine('fallback');
  if(!SR){alert('Speech input not supported in this browser. Please type instead.');return()=>{}}
  const r=new SR();r.continuous=true;r.interimResults=true;r.lang=SPEECH.find(x=>x[0]===lang)?.[2]||'en-IN';
  let acc='';r.onresult=(e:any)=>{let t='';for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;acc=t;onText(t,false)};
  r.onend=()=>onText(acc,true);const tick=setInterval(()=>onLevel(Math.random()*.6),120);r.start();
  return()=>{clearInterval(tick);r.stop()};
}
export async function ocr(file:File){const T=await import('tesseract.js');const {data}=await T.recognize(file,'eng');const t=data.text;
  const m=(r:RegExp)=>t.match(r)?.[1]?.trim()||'';
  return {text:t,fields:{'Invoice number':m(/(?:invoice|inv|bill)\s*(?:no|number|#)?[.:\s#-]*([A-Z0-9-]{4,})/i),Date:m(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/),Vendor:t.split('\n').find(l=>l.trim().length>3)?.trim()||'',Amount:m(/(?:total|amount|₹|rs\.?)\s*[:\-]?\s*([\d,]+(?:\.\d\d)?)/i)}}}
const T=(raw:string,clean:string,cat:string,title:string,lang='Hinglish',status='Ready to Submit',ev=1):Case=>{const a=analyze(clean);return{id:Math.random().toString(36).slice(2,8),title,category:cat,status,lang,date:new Date().toLocaleDateString('en-IN'),confidence:a.confidence,evidence:ev,raw,clean,fields:{...a.fields,Issue:CATS[cat].label,Authority:CATS[cat].auth},doc:'',timeline:['Created from voice','Document generated']}};
const seed=():Case[]=>[
['Uh, mujhe, um, Ahmedabad Naroda road pe sadak ki shikayat karni hai, paani bhar raha hai aur log phisal rahe hain','There is severe waterlogging and a pothole on Naroda Road, Ahmedabad. People are slipping and it is urgent.','civic','Pothole & waterlogging – Naroda, Ahmedabad','Hinglish','Draft'],
['Maine Amazon se laptop mangaya tha Rs 54,999 ka, defective nikla, seller refund nahi de raha','I ordered a laptop for ₹54,999 from an online seller. It is defective and the seller refuses a refund.','consumer','Defective laptop refund – online seller','Hinglish','Ready to Submit'],
['RTI karni hai Ahmedabad municipal corporation se road repair project ka status','I want to file an RTI with the Ahmedabad Municipal Corporation for the status of the road repair project.','rti','RTI – road repair project status','English','Submitted'],
['Landlord deposit wapas nahi kar raha, 40000 rupees, makan Surat mein khali kiya do mahine pehle','My landlord in Surat is not returning my ₹40000 security deposit two months after I vacated.','rental','Rental deposit dispute – Surat','Hinglish','Follow-up Needed']
].map(([r,c,k,t,l,s])=>{const x=T(r,c,k,t,l,s);x.doc=buildDoc(k,x.fields,c);return x});
type S={cases:Case[];ui:string;set:(c:Case[])=>void;setUi:(u:string)=>void};
export const useStore=create<S>((set,get)=>({cases:seed(),ui:'en',setUi:ui=>set({ui}),set:cases=>{set({cases});fetch('/api/cases',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(cases)}).catch(()=>{})}}));
fetch('/api/cases').then(r=>r.json()).then(d=>d&&useStore.setState({cases:d})).catch(()=>{});
export const SPEECH:[string,string,string,string[]|undefined][]=[
['auto','Auto-detect','en-IN',undefined],['en','English','en-IN',['en']],['hi','हिन्दी (Hindi)','hi-IN',['hi']],['hinglish','Hinglish','hi-IN',['hi','en']],
['gu','ગુજરાતી (Gujarati)','gu-IN',['gu']],['mr','मराठी (Marathi)','mr-IN',['mr']],['ta','தமிழ் (Tamil)','ta-IN',['ta']],['kn','ಕನ್ನಡ (Kannada)','kn-IN',['kn']],
['kok','कोंकणी (Konkani)','mr-IN',['mr']],['pa','ਪੰਜਾਬੀ (Punjabi)','pa-IN',['pa']],['te','తెలుగు (Telugu)','te-IN',['te']],['as','অসমীয়া (Assamese)','as-IN',['as']],['ml','മലയാളം (Malayalam)','ml-IN',['ml']]];
export const ttsLang=(t:string)=>([[/[\u0A80-\u0AFF]/,'gu-IN'],[/[\u0B80-\u0BFF]/,'ta-IN'],[/[\u0C80-\u0CFF]/,'kn-IN'],[/[\u0C00-\u0C7F]/,'te-IN'],[/[\u0D00-\u0D7F]/,'ml-IN'],[/[\u0A00-\u0A7F]/,'pa-IN'],[/[\u0980-\u09FF]/,'bn-IN'],[/[\u0900-\u097F]/,'hi-IN']] as [RegExp,string][]).find(([r])=>r.test(t))?.[1]||'en-IN';
const D=(h:string,s:string,start:string,demo:string,tap:string,home:string,speak:string,dash:string,cases:string)=>({h,s,start,demo,tap,home,speak,dash,cases});
export const I18N:Record<string,Record<string,string>>={
en:D('Speak your problem. Get your paperwork done.','Vaani turns your voice into ready-to-submit complaints, RTIs, consumer claims, and legal drafts.','Start speaking','See a live demo','Tap and speak in your language','Home','Speak','Dashboard','Cases')};
// ---- practical extras ----
export const DUE:Record<string,number>={civic:15,consumer:30,rti:30,rental:15,legal:15,police:7,insurance:15,custom:15};
export const PORTALS:Record<string,{name:string;url:string}>={
civic:{name:'CPGRAMS public grievance portal (also check your city corporation\'s own portal)',url:'https://pgportal.gov.in'},
consumer:{name:'e-Daakhil – file with the consumer commission',url:'https://edaakhil.nic.in'},
rti:{name:'RTI Online (central departments; states have their own portals)',url:'https://rtionline.gov.in'},
rental:{name:'eCourts services',url:'https://services.ecourts.gov.in'},
legal:{name:'eCourts services',url:'https://services.ecourts.gov.in'},
police:{name:'National Cyber Crime Reporting Portal (online fraud only; otherwise visit your police station)',url:'https://cybercrime.gov.in'},
insurance:{name:'Council for Insurance Ombudsmen',url:'https://www.cioins.co.in'},
custom:{name:'CPGRAMS public grievance portal',url:'https://pgportal.gov.in'}};
export const CHECK:Record<string,string[]>={
civic:['Photos of the problem (with date)','Exact address / landmark','Earlier complaint number, if any'],
consumer:['Invoice / bill','Order or payment proof','Screenshots of chats or emails with seller','Warranty card'],
rti:['Application fee proof (usually ₹10)','Your ID / address','Exact period and subject of records'],
rental:['Rent agreement','Deposit payment proof','Messages with landlord','Photos of the flat at move-out'],
legal:['All relevant documents','Timeline of events','Proof of earlier requests'],
police:['ID proof','Photos / evidence','Names and details of witnesses'],
insurance:['Policy copy','Claim form','Bills and medical / repair reports','Rejection letter, if any'],
custom:['ID proof','Supporting documents']};
export function dueInfo(c:Case){const [d,m,y]=c.date.split('/').map(Number);const due=new Date(y,m-1,d+DUE[c.category]);
  const left=Math.ceil((due.getTime()-Date.now())/864e5);return {left,on:due.toLocaleDateString('en-IN')}}
export function followUp(c:Case){const rti=c.category==='rti';
  return `${c.doc}\n\n${'='.repeat(30)}\nFOLLOW-UP LETTER (${new Date().toLocaleDateString('en-IN')})\n\nSubject: Reminder – ${c.title}\n\nTo,\n${c.fields.Authority}\n\nRespected Sir/Madam,\n\nI submitted the above ${CATS[c.category].label.toLowerCase()} on ${c.date}. I have not received a satisfactory response.\n\nI request you to update me on the status and take the action asked for: ${c.fields.Outcome}.\n${rti?'\nIf no reply is received within the legal time limit, I will file a First Appeal under Section 19(1) of the RTI Act, 2005.\n':'\nIf the matter stays unresolved, I may escalate it to the next higher authority.\n'}\nYours faithfully,\nApplicant`}
export const detectLang=(t:string)=>(([[/[\u0A80-\u0AFF]/,'gu'],[/[\u0B80-\u0BFF]/,'ta'],[/[\u0C80-\u0CFF]/,'kn'],[/[\u0C00-\u0C7F]/,'te'],[/[\u0D00-\u0D7F]/,'ml'],[/[\u0A00-\u0A7F]/,'pa'],[/[\u0980-\u09FF]/,'as'],[/[\u0900-\u097F]/,'hi']] as [RegExp,string][]).find(([r])=>r.test(t))?.[1])||'en';
