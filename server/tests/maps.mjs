import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {pool} from '../db.mjs';
import {mapConfig,mapLead,queryFor,runMapTask} from '../maps.mjs';
import {websiteUrl,publicAddress,publicGet,websiteContacts} from '../public-web.mjs';
const ids={plan:randomUUID(),task:randomUUID()};
try{
 assert.throws(()=>mapConfig({cities:['unknown']}));assert.throws(()=>mapConfig({categories:['";out;']}));assert.throws(()=>mapConfig({limit:100}));assert.match(queryFor('Lagos',['bags'],10),/out tags 10/);
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','192.168.0.1','::1','::ffff:127.0.0.1'])assert.equal(publicAddress(ip),false);
 assert.throws(()=>websiteUrl('file:///etc/passwd'));assert.throws(()=>websiteUrl('https://user:password@example.com'));
 await assert.rejects(()=>publicGet('http://127.0.0.1:3001/'));
 const allowed=await websiteContacts('https://example.com/','Nigeria',async url=>url.endsWith('robots.txt')?{status:200,body:'User-agent: *\nDisallow: /',url,headers:{}}:{status:200,url,headers:{'content-type':'text/html'},body:'Shop contact: buyer@example.com'});assert.equal(allowed.status,'blocked');
 const cfg=mapConfig({cities:['Lagos'],categories:['bags'],limit:2,enrichWebsite:true});
 await pool.execute('INSERT INTO yt_prospect_plans (id,name,config) VALUES (?,?,?)',[ids.plan,'__MAPS_FIXTURE__',JSON.stringify(cfg)]);
 await pool.execute("INSERT INTO yt_prospect_tasks (id,plan_id,config,provider,status) VALUES (?,?,?,'osm_fixture','running')",[ids.task,ids.plan,JSON.stringify(cfg)]);
 const fixtureId=Date.now(),fixture={type:'node',id:fixtureId,tags:{name:'__MAPS_FIXTURE__',shop:'bags',phone:'+999123456789',website:'https://example.com/',email:'fixture@example.invalid','addr:city':'Lagos'}};
 let calls=0;await runMapTask({id:ids.task,config:cfg},async()=>{calls++;return [fixture,fixture]},async()=>({status:'needs_review',contacts:{email:'site@example.invalid',phone:''},evidence:'Fixture website source only'}));
 assert.equal(calls,1);const [leads]=await pool.execute('SELECT * FROM yt_prospect_leads WHERE task_id=?',[ids.task]);assert.equal(leads.length,1);assert.equal(leads[0].platform,'OpenStreetMap');assert.equal(leads[0].score,0);assert.match(leads[0].evidence,/ODbL/);const contact=typeof leads[0].contact_data==='string'?JSON.parse(leads[0].contact_data):leads[0].contact_data;assert.equal(contact.email,'site@example.invalid');assert.equal(contact.whatsapp,'');
 const [t]=await pool.execute('SELECT status,calls_used FROM yt_prospect_tasks WHERE id=?',[ids.task]);assert.equal(t[0].status,'completed');assert.equal(t[0].calls_used,1);
 assert.equal(mapLead({type:'bad',id:1,tags:{name:'Invalid'}},'Lagos'),null);
 console.log('PASS: map config/query validation, SSRF private-address prevention, robots exclusion, task persistence, dedup, attribution, website evidence, no false WhatsApp or intent. No public provider called.');
}finally{await pool.execute('DELETE FROM yt_prospect_leads WHERE task_id=?',[ids.task]);await pool.execute('DELETE FROM yt_prospect_tasks WHERE id=?',[ids.task]);await pool.execute('DELETE FROM yt_prospect_plans WHERE id=?',[ids.plan]);await pool.end();console.log('Map integration fixtures cleaned up')}
