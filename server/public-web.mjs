import {lookup} from 'node:dns/promises';
import https from 'node:https';
import http from 'node:http';
import ipaddr from 'ipaddr.js';
import robotsParser from 'robots-parser';
import {extract} from './enrichment.mjs';
const agent='YuetuoTrade/1.0 (+https://github.com/wosqqa/ai-trade-team)';
export function publicAddress(address){try{return ipaddr.process(address).range()==='unicast'}catch{return false}}
export function websiteUrl(value){const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port&&!['80','443'].includes(u.port))throw Error('官网 URL 不允许');if(u.hostname==='localhost'||u.hostname.endsWith('.local')||u.hostname.endsWith('.localhost'))throw Error('禁止本机或私有地址');return u}
export async function publicGet(input,redirects=0){const u=websiteUrl(input);const addresses=await lookup(u.hostname,{all:true});if(!addresses.length||addresses.some(a=>!publicAddress(a.address)))throw Error('官网解析到非公开网络，已拒绝访问');const chosen=addresses.find(a=>a.family===4)||addresses[0];
 const result=await new Promise((resolve,reject)=>{const req=(u.protocol==='https:'?https:http).get(u,{headers:{'User-Agent':agent,Accept:'text/html,text/plain'},lookup:(_host,options,cb)=>options?.all?cb(null,[chosen]):cb(null,chosen.address,chosen.family)},res=>{let size=0;const chunks=[];res.on('data',chunk=>{size+=chunk.length;if(size>750000){req.destroy(Error('网页超过大小上限'));return}chunks.push(chunk)});res.on('error',reject);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString('utf8'),url:u.href}))});req.setTimeout(8000,()=>req.destroy(Error('官网读取超时')));req.on('error',reject)});
 if([301,302,303,307,308].includes(result.status)){if(redirects>=2||!result.headers.location)throw Error('官网重定向过多');return publicGet(new URL(result.headers.location,u).href,redirects+1)}return result;
}
export function visibleText(html){return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&#64;|&commat;/g,'@').replace(/\s+/g,' ').trim()}
export async function websiteContacts(input,country='Nigeria',get=publicGet){const original=websiteUrl(input);let robots;try{const r=await get(new URL('/robots.txt',original).href);if(r.status===200)robots=robotsParser(new URL('/robots.txt',original).href,r.body);else if(r.status!==404)return {status:'blocked',message:'无法确认官网访问规则，保留线索待人工补全'}}catch{return {status:'blocked',message:'官网访问规则读取失败，保留线索待人工补全'}}
 if(robots?.isAllowed(original.href,'YuetuoTrade')===false)return {status:'blocked',message:'官网 robots.txt 不允许读取该页面'};
 let page;try{page=await get(original.href)}catch{return {status:'blocked',message:'官网连接失败或地址受限制'}}
 if(page.status!==200||!String(page.headers['content-type']).includes('text/html'))return {status:'blocked',message:'官网不是可读取的公开 HTML'};
 // A redirected page is fetched only after validating its address. Do not extract from another origin.
 if(new URL(page.url).origin!==original.origin)return {status:'blocked',message:'官网跳转到其他站点，请人工核对'};
 const text=visibleText(page.body).slice(0,20000),found=extract(text,country);return {status:'needs_review',message:'已从官网可见公开文本提取，需人工核对',contacts:found,evidence:`官网来源：${page.url}\n${text}`,source:page.url};
}
