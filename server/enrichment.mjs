import {Router} from 'express';
import {randomUUID} from 'node:crypto';
import {db} from './db.mjs';
export const enrichment=Router();
const parse=v=>typeof v==='string'?JSON.parse(v):v;
function fail(message,status=400){throw Object.assign(new Error(message),{status})}
export function phone(value,country='Nigeria'){let s=String(value||'').replace(/[^\d+]/g,'');if(s.startsWith('00'))s='+'+s.slice(2);if(/^0\d{10}$/.test(s)&&/nigeria|尼日利亚/i.test(country))s='+234'+s.slice(1);if(!/^\+[1-9]\d{7,14}$/.test(s))return '';return s}
export function extract(text,country='Nigeria'){
 const emails=[...new Set((text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[]).map(s=>s.toLowerCase()))].slice(0,10);
 const phones=[...new Set((text.match(/(?:\+\d|00\d)[\d ()\-.]{6,22}\d|\b0\d{10}\b/g)||[]).map(s=>phone(s,country)).filter(Boolean))].slice(0,10);
 const wa=text.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\d{8,15})/i);
 return {email:emails[0]||'',phone:phones[0]||'',whatsapp:wa?phone('+'+wa[1],country):'',address:'',instagram:'',emails,phones};
}
export function contactFields(v,country='Nigeria'){
 const result={};for(const [key,max] of Object.entries({email:254,phone:40,whatsapp:40,address:500,instagram:100})){const s=v?.[key]??'';if(typeof s!=='string'||s.length>max)fail(`${key} 格式错误`);result[key]=s.trim()}
 result.email=result.email.toLowerCase();if(result.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email))fail('邮箱格式错误');for(const key of ['phone','whatsapp']){if(result[key]&&!phone(result[key],country))fail('电话 / WhatsApp 请填写国际号码，例如 +234…');result[key]=phone(result[key],country)}
 if(result.instagram){result.instagram=result.instagram.replace(/^@/,'');if(!/^[a-zA-Z0-9_.]{1,100}$/.test(result.instagram))fail('Instagram 请填写账号名称')}
 return result;
}
export async function enrichSchema(conn){
 for(const table of ['yt_customers','yt_prospect_leads']){
 const [cols]=await conn.query(`SHOW COLUMNS FROM ${table}`);const names=new Set(cols.map(c=>c.Field));
 const fields=table==='yt_customers'?{phone:"VARCHAR(40) NOT NULL DEFAULT ''",whatsapp:"VARCHAR(40) NOT NULL DEFAULT ''",address:"VARCHAR(500) NOT NULL DEFAULT ''",instagram:"VARCHAR(100) NOT NULL DEFAULT ''"}:{contact_data:'JSON NULL',contact_evidence:'TEXT NULL',enrichment_status:"VARCHAR(40) NOT NULL DEFAULT 'not_checked'",enrichment_message:"VARCHAR(500) NOT NULL DEFAULT ''"};
 for(const [key,type]of Object.entries(fields))if(!names.has(key))await conn.query(`ALTER TABLE ${table} ADD COLUMN ${key} ${type}`);
 }
}
async function lead(id){const conn=await db();const [r]=await conn.execute('SELECT l.*,t.config FROM yt_prospect_leads l JOIN yt_prospect_tasks t ON l.task_id=t.id WHERE l.id=?',[id]);if(!r.length)fail('线索不存在',404);return {...r[0],config:parse(r[0].config)}}
enrichment.post('/leads/:id/extract',async(req,res)=>{
 const l=await lead(req.params.id);if(l.status==='approved')fail('已入库资料请在 CRM 编辑',409);
 const text=req.body.text;if(typeof text!=='string'||!text.trim()||text.length>30000)fail('请粘贴 1–30000 字公开简介 / 联系资料');
 const found=extract(text,l.config.country),conn=await db();await conn.execute("UPDATE yt_prospect_leads SET contact_data=?,contact_evidence=?,enrichment_status='needs_review',enrichment_message='已从粘贴的公开资料提取候选联系方式，请核对后保存' WHERE id=?",[JSON.stringify(found),text,l.id]);res.json(found);
});
enrichment.put('/leads/:id/contact',async(req,res)=>{
 const l=await lead(req.params.id);if(l.status==='approved')fail('已入库资料请在 CRM 编辑',409);const contacts=contactFields(req.body,l.config.country);const conn=await db();await conn.execute("UPDATE yt_prospect_leads SET contact_data=?,enrichment_status='reviewed',enrichment_message='公开联系方式已经人工核对；未验证邮箱送达或号码归属' WHERE id=?",[JSON.stringify(contacts),l.id]);res.json(contacts);
});
// No cookies or login automation; only fixed public platform hosts, no arbitrary redirects.
export async function readPublicProfile(url){
 const u=new URL(url);if(!['facebook.com','instagram.com','tiktok.com'].includes(u.hostname)||u.protocol!=='https:')fail('主页地址不允许');
 const r=await fetch(u,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{Accept:'text/html'}});
 if(!r.ok)fail(`公开页面返回 HTTP ${r.status}，请打开主页复制公开联系资料`,422);
 if(!r.headers.get('content-type')?.includes('text/html'))fail('不是可读取的公开网页',422);
 const reader=r.body.getReader();const buffers=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1500000)fail('页面过大，请手动粘贴公开联系资料',422);buffers.push(Buffer.from(value))}}finally{await reader.cancel()}
 const html=Buffer.concat(buffers).toString('utf8');
 const text=html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&#64;|&commat;/g,'@').replace(/\s+/g,' ').trim();
 if(text.length<100||(/log in|登录|sign up/i.test(text)&&!extract(text).email&&!extract(text).phone))fail('页面要求登录或公开资料不可读取，请打开主页复制简介内容',422);
 return text.slice(0,30000);
}
export async function enrichLead(id){const l=await lead(id);if(l.status==='approved')fail('已入库资料请在 CRM 编辑',409);const conn=await db();try{const text=await readPublicProfile(l.url),found=extract(text,l.config.country);await conn.execute("UPDATE yt_prospect_leads SET contact_data=?,contact_evidence=?,enrichment_status='needs_review',enrichment_message=? WHERE id=?",[JSON.stringify(found),text,found.email||found.phone?'已读取公开文本，候选联系方式待核对':'公开文本未发现联系方式；不能认定店铺没有联系方式',l.id]);return {contacts:found}}catch(e){const message=e.status?e.message:'平台访问失败，请打开原始主页后粘贴公开联系资料';await conn.execute("UPDATE yt_prospect_leads SET enrichment_status='blocked',enrichment_message=? WHERE id=?",[message,l.id]);fail(message,422)}}
enrichment.post('/leads/:id/enrich',async(req,res)=>res.json(await enrichLead(req.params.id)));
export async function approveLead(c,l,country,note){
 const data=contactFields(parse(l.contact_data)||{},country);
 if((data.email||data.phone||data.whatsapp)&&l.enrichment_status!=='reviewed')fail('请先核对并保存联系方式，再审核入库');
 const [plans]=await c.execute('SELECT config FROM yt_prospect_tasks WHERE id=?',[l.task_id]);
 const ids=new Set();const [sources]=await c.execute('SELECT customer_id FROM yt_prospect_sources WHERE url_hash=?',[l.url_hash]);sources.forEach(s=>ids.add(s.customer_id));
 const predicates=[],args=[];if(data.email){predicates.push('LOWER(TRIM(email))=?');args.push(data.email)}for(const number of new Set([data.phone,data.whatsapp].filter(Boolean))){predicates.push('phone=? OR whatsapp=?');args.push(number,number)}
 if(predicates.length){const [matches]=await c.execute('SELECT id FROM yt_customers WHERE '+predicates.map(p=>'('+p+')').join(' OR '),args);matches.forEach(s=>ids.add(s.id))}
 if(ids.size>1)fail('主页、邮箱或电话分别匹配到不同客户，请先核实资料，未自动合并',409);
 let id=[...ids][0],merged=Boolean(id);
 if(!id){id=randomUUID();await c.execute('INSERT INTO yt_customers (id,name,country,product,stage,score,email,phone,whatsapp,address,instagram) VALUES (?,?,?,?,?,?,?,?,?,?,?)',[id,l.name,country,parse(plans[0].config).product,'待联系',l.score,data.email,data.phone,data.whatsapp,data.address,data.instagram])}
 else{for(const [key,value]of Object.entries(data))if(value)await c.execute(`UPDATE yt_customers SET ${key}=? WHERE id=? AND (${key}='' OR ${key} IS NULL)`,[value,id])}
 await c.execute('INSERT INTO yt_prospect_sources (url_hash,url,customer_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE url=url',[l.url_hash,l.url,id]);
 await c.execute("UPDATE yt_prospect_leads SET status='approved',customer_id=?,country=?,review_note=? WHERE id=?",[id,country,note,l.id]);return {customerId:id,merged};
}
