import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
let context;
export async function closeLocalBrowser(){const c=context;context=undefined;await c?.close().catch(()=>{})}
function pause(message){throw Object.assign(new Error(message),{status:409,browserPaused:true})}
async function browser(){if(context)return context;await mkdir('.local/prospect-browser',{recursive:true});try{context=await chromium.launchPersistentContext(resolve('.local/prospect-browser'),{channel:'chrome',headless:false,viewport:{width:1280,height:850},args:['--no-default-browser-check']});context.on('close',()=>{context=undefined});return context}catch{throw Object.assign(new Error('无法启动本地 Chrome；请安装 Chrome，或关闭本系统上次遗留的专用浏览器窗口后重试'),{status:503})}}
function challenge(text,url){return /\/sorry\/|captcha|challenge/i.test(url)||/unusual traffic|verify you are human|异常流量|人机验证|证明您不是机器人/i.test(text)}
export async function browserSearch(query,count){const ctx=await browser();let page=ctx.pages()[0]||await ctx.newPage();
 await page.goto('https://www.google.com/search?'+new URLSearchParams({q:query,hl:'en',num:String(Math.min(count,20))}),{waitUntil:'domcontentloaded',timeout:30000});
 try{await page.locator('h3').first().waitFor({timeout:10000})}catch{}
 const text=await page.locator('body').innerText();if(challenge(text,page.url()))pause('搜索页出现验证，请在系统专用 Chrome 窗口中手动处理，然后点击继续任务');
 if(/consent\.google/.test(page.url())||/Before you continue to Google/.test(text))pause('搜索页需要你确认隐私选项，请在专用 Chrome 窗口处理后点击继续');
 const links=await page.locator('a:has(h3)').evaluateAll(nodes=>nodes.map(a=>({title:a.querySelector('h3')?.textContent||'',url:a.href,description:a.closest('[data-hveid]')?.textContent?.slice(0,1500)||a.parentElement?.textContent?.slice(0,1500)||''})));
 if(!links.length&&!/did not match any documents|No results found|找不到和您查询/i.test(text))pause('搜索页未识别到结果，请在专用 Chrome 中检查页面后继续；未伪造空结果');
 return links.map(r=>{try{const u=new URL(r.url);if(u.hostname==='www.google.com'&&u.pathname==='/url')r.url=u.searchParams.get('q')||u.searchParams.get('url')||r.url;return r}catch{return null}}).filter(r=>r&&/https:\/\/(www\.|m\.)?(facebook\.com|instagram\.com|tiktok\.com)\//i.test(r.url)).slice(0,count);
}
export async function browserProfile(url){const u=new URL(url);if(u.protocol!=='https:'||u.port||u.username||u.password||!['facebook.com','instagram.com','tiktok.com'].includes(u.hostname))return {blocked:true,message:'主页链接不允许'};const ctx=await browser();const page=await ctx.newPage();let paused=false;
 try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});try{await page.locator('body').waitFor({timeout:8000})}catch{}const text=(await page.locator('body').innerText()).slice(0,30000);
 if(challenge(text,page.url())){page.bringToFront().catch(()=>{});pause('店铺页面出现验证，请在专用 Chrome 窗口人工处理后继续任务')}
 if(/\/login|\/checkpoint/.test(page.url())||text.length<100)return {blocked:true,message:'主页要求登录或资料不可见，需人工补全'};
 return {text};
 }catch(e){if(e.browserPaused){paused=true;throw e}return {blocked:true,message:'本地浏览器读取主页失败，保留搜索证据待人工补全'}}finally{if(!paused&&!page.isClosed())await page.close()}
}
