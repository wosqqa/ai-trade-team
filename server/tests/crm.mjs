import 'dotenv/config';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {pool} from '../db.mjs';
const port=3107, token=process.env.API_TOKEN;
const child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,API_PORT:String(port)},stdio:'ignore'});
let id;
async function call(path,method='GET',body,auth=true){const r=await fetch(`http://127.0.0.1:${port}/api/${path}`,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()}}
try{
 for(let i=0;i<40;i++){try{await call('health');break}catch{await new Promise(r=>setTimeout(r,100))}}
 assert.equal((await call('customers','GET',undefined,false)).status,401);
 assert.equal((await call('customers','POST',{name:''})).status,400);
 const created=await call('customers','POST',{name:`__API_TEST_${Date.now()}`,country:'测试',email:'test@example.com'});assert.equal(created.status,201);id=created.data.id;
 assert.equal((await call('customers/'+id,'PUT',{...created.data,stage:'已发报价'})).data.stage,'已发报价');
 assert.equal((await call('customers/'+id,'PUT',{...created.data,stage:'非法阶段'})).status,400);
 assert.equal((await call(`customers/${id}/contacts`,'POST',{name:'测试联系人',role:'采购',email:'buyer@example.com'})).status,201);
 assert.equal((await call(`customers/${id}/contacts`)).data.length,1);
 assert.equal((await call(`customers/${id}/followups`,'POST',{content:'测试跟进：确认需求'})).status,201);
 assert.equal((await call(`customers/${id}/followups`)).data[0].content,'测试跟进：确认需求');
 assert.equal((await call('customers?q='+encodeURIComponent(created.data.name)+'&stage=已发报价')).data.total,1);
 assert.equal((await call('customers/00000000-0000-0000-0000-000000000000')).status,404);
 console.log('PASS: authentication, validation, create/update, search/filter, contacts, followup persistence, missing customer');
}finally{
 if(id){await pool.execute('DELETE FROM yt_followups WHERE customer_id=?',[id]);await pool.execute('DELETE FROM yt_contacts WHERE customer_id=?',[id]);await pool.execute('DELETE FROM yt_customers WHERE id=?',[id]);console.log('Test rows cleaned up')}
 child.kill('SIGTERM');await pool.end();
}
