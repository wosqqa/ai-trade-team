import 'dotenv/config';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {pool} from '../db.mjs';
import {normalize,assess,defaults,tick} from '../discovery.mjs';
const child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,API_PORT:'3108',DISCOVERY_WORKER:'false',BRAVE_SEARCH_API_KEY:'test-no-network',SEARCH_ALLOW_CALLS:'true'},stdio:'ignore'});
let plan;const tasks=[],customers=[];
async function api(path,method='GET',body){const r=await fetch('http://127.0.0.1:3108/api/'+path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.API_TOKEN},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()}}
try{
 for(let i=0;i<40;i++){try{await api('health');break}catch{await new Promise(r=>setTimeout(r,100))}}
 assert.equal(normalize('https://www.instagram.com/Test_Shop/?utm_source=a').url,'https://instagram.com/test_shop');
 assert.throws(()=>normalize('https://instagram.com.evil.example/shop'));
 assert.throws(()=>normalize('https://instagram.com/p/post'));
 assert.throws(()=>normalize('http://instagram.com/shop'));
 assert.equal(normalize('https://facebook.com/profile.php?id=123').hash,normalize('https://facebook.com/people/Test/123/').hash);
 assert.equal(assess('Lagos school bag shop',defaults).score,85);
 assert.equal(assess('No evidence',defaults).score,0);
 let r=await api('discovery/plans','POST',{name:'__DISCOVERY_TEST__',config:defaults});assert.equal(r.status,201);plan=r.data.id;
 async function create(provider){const r=await api('discovery/tasks','POST',{planId:plan,provider});assert.equal(r.status,201);tasks.push(r.data.id);return r.data.id}
 const id=await create('manual');const entry={name:'__TEST_SHOP__',url:`https://instagram.com/yt_test_${Date.now()}`,evidence:'Lagos Nigeria school bag set store, publicly pasted test fixture, not a real lead'};
 r=await api(`discovery/tasks/${id}/import`,'POST',{entries:[entry,entry]});assert.deepEqual(r.data,{added:1,duplicates:1});
 assert.equal((await api(`discovery/tasks/${id}/import`,'POST',{entries:[{...entry,url:'https://evil.example/'}]})).status,400);
 const lead=(await api('discovery/tasks/'+id)).data.leads[0];assert.equal(lead.score,85);assert.equal(lead.country,'');
 assert.equal((await api(`discovery/leads/${lead.id}/review`,'POST',{action:'approve',country:''})).status,400);
 r=await api(`discovery/leads/${lead.id}/review`,'POST',{action:'approve',country:'Nigeria',note:'Integration test only'});assert.equal(r.status,200);customers.push(r.data.customerId);
 assert.equal((await api(`discovery/leads/${lead.id}/review`,'POST',{action:'approve',country:'Nigeria'})).data.customerId,customers[0]);
 assert.equal((await api('customers/'+customers[0]+'/sources')).data.length,1);
 const second=await create('manual');await api(`discovery/tasks/${second}/import`,'POST',{entries:[entry]});const l2=(await api('discovery/tasks/'+second)).data.leads[0];
 assert.equal((await api(`discovery/leads/${l2.id}/review`,'POST',{action:'approve',country:'Nigeria'})).data.customerId,customers[0]);
 // Contact enrichment uses supplied public-text fixtures, no platform network call.
 const fixtureEmail=`discovery-${Date.now()}@example.invalid`;const fixturePhone='+999'+String(Date.now()).slice(-10);const fixture=`Nigeria school bag store, contact ${fixtureEmail}, ${fixturePhone}`;
 const third=await create('manual');await api(`discovery/tasks/${third}/import`,'POST',{entries:[{...entry,url:entry.url+'_other',evidence:fixture}]});
 const l3=(await api('discovery/tasks/'+third)).data.leads[0];
 const extracted=await api(`discovery/leads/${l3.id}/extract`,'POST',{text:fixture});assert.equal(extracted.data.phone,fixturePhone);
 assert.equal((await api(`discovery/leads/${l3.id}/review`,'POST',{action:'approve',country:'Nigeria'})).status,400);
 assert.equal((await api(`discovery/leads/${l3.id}/contact`,'PUT',{email:fixtureEmail,phone:fixturePhone,whatsapp:fixturePhone,address:'Test only'})).status,200);
 const approved=await api(`discovery/leads/${l3.id}/review`,'POST',{action:'approve',country:'Nigeria'});assert.equal(approved.status,200);customers.push(approved.data.customerId);
 const saved=(await api('customers/'+approved.data.customerId)).data;assert.equal(saved.phone,fixturePhone);assert.equal(saved.email,fixtureEmail);
 const fourth=await create('manual');await api(`discovery/tasks/${fourth}/import`,'POST',{entries:[{...entry,url:entry.url+'_duplicate'}]});const l4=(await api('discovery/tasks/'+fourth)).data.leads[0];
 await api(`discovery/leads/${l4.id}/contact`,'PUT',{email:fixtureEmail.toUpperCase(),phone:fixturePhone});
 const merged=await api(`discovery/leads/${l4.id}/review`,'POST',{action:'approve',country:'Nigeria'});assert.equal(merged.data.customerId,approved.data.customerId);assert.equal(merged.data.merged,true);
 const worker=await create('brave');let calls=0;await tick(async()=>{calls++;return [{title:'Mock result',url:`https://${calls===1?'instagram':'facebook'}.com/test_${worker}`,description:'Nigeria school bag shop'}]});
 const done=(await api('discovery/tasks/'+worker)).data;assert.equal(done.status,'completed');assert.equal(done.calls_used,2);assert.equal(done.leads.length,2);
 const failure=await create('brave');await tick(async()=>{throw Object.assign(new Error('Test provider failure'),{status:502})});assert.equal((await api('discovery/tasks/'+failure)).data.status,'failed');
 console.log('PASS: plan/task persistence, URL validation, scoring, deduplication, review idempotency, cross-task CRM link, evidence, mock worker success/failure. No search service called.');
}finally{
 for(const id of tasks)await pool.execute('DELETE FROM yt_prospect_leads WHERE task_id=?',[id]);
 for(const id of customers){await pool.execute('DELETE FROM yt_prospect_sources WHERE customer_id=?',[id]);await pool.execute('DELETE FROM yt_customers WHERE id=?',[id])}
 for(const id of tasks)await pool.execute('DELETE FROM yt_prospect_tasks WHERE id=?',[id]);
 if(plan)await pool.execute('DELETE FROM yt_prospect_plans WHERE id=?',[plan]);child.kill('SIGTERM');await pool.end();console.log('Integration test rows cleaned up');
}
