import express from 'express';import cors from 'cors';import dotenv from 'dotenv';import fs from 'fs';
dotenv.config();const app=express();app.use(cors(),express.json({limit:'5mb'}));
const DB='server/data.json';
// Short-lived Wispr Flow client token (API key never reaches the browser)
app.post('/api/wispr/token',async(_q,res)=>{
  if(!process.env.WISPR_API_KEY)return res.json({available:false});
  try{const r=await fetch('https://platform-api.wisprflow.ai/api/v1/dash/generate_access_token',{method:'POST',
    headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.WISPR_API_KEY}`},
    body:JSON.stringify({client_id:'vaani-'+Date.now(),duration_secs:300})});
    if(!r.ok)return res.json({available:false,error:r.status});
    const d=await r.json();res.json({available:true,token:d.access_token});
  }catch(e){res.json({available:false,error:String(e)})}
});
app.get('/api/cases',(_q,res)=>res.json(fs.existsSync(DB)?JSON.parse(fs.readFileSync(DB,'utf8')):null));
app.put('/api/cases',(q,res)=>{fs.writeFileSync(DB,JSON.stringify(q.body));res.json({ok:true})});
app.delete('/api/cases',(_q,res)=>{fs.existsSync(DB)&&fs.unlinkSync(DB);res.json({ok:true})});
app.listen(process.env.PORT||8787,()=>console.log('Vaani API on :'+(process.env.PORT||8787)));
