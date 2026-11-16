<script setup lang="ts">
import { computed, ref, watch } from 'vue'
type Feature={id:string;name:string;status:string;note:string}
type Module={id:string;name:string;goal:string;features:Feature[]}
const seeds:[string,string,string[]][]=[
['工作台与待办','每天先处理什么',['经营概览','今日待办与超期提醒','重点客户推荐','审批与异常通知']],
['产品与企业知识库','我们卖什么，有什么优势',['产品规格、图片与目录','MOQ、价格、交期与定制能力','企业介绍与认证资料','话术模板与知识版本管理']],
['客户挖掘中心','去哪里找合适的客户',['目标客户画像与排除条件','多语言关键词与任务配置','公开搜索与企业官网接入','海关、展会、企业库等数据源','企业清洗去重','来源证据与人工审核入库']],
['客户分析与背调','为什么值得开发',['企业与销售渠道画像','产品匹配度及评分依据','采购信号与需求核实','采购岗位与公开联系方式','联系方式验证与风险提示']],
['客户 CRM','客户资产由谁管理',['企业与联系人档案','标签、阶段与客户分层','负责人、公海与防撞单','客户互动时间线','导入导出与重复客户合并']],
['开发与跟进中心','怎么联系，下一步做什么',['多语言开发信草稿','跟进记录与下次跟进计划','真实邮箱发送与回复同步','统一收件箱与多渠道记录','序列跟进与停止规则','退订与禁止联系名单']],
['询盘与商机中心','如何把需求推进成交',['箱包需求字段与询盘分配','报价版本、条款与附件','样品寄送与客户反馈','商机阶段与成交流失原因','订单摘要与 ERP 交接']],
['AI 协作指挥中心','谁执行，谁验收',['负责人目标与重要操作审批','AI 总经理任务拆解与派发','客户开发 Agent','业务跟进 Agent','店铺运营 Agent：Shopify / Shopee / TK / Lazada','短视频 Agent：脚本、剪辑、发布','广告专家 Agent：素材、预算与建议','数据分析 Agent','任务进度、重试、验收与执行日志']],
['营销与内容资产','如何扩展获客渠道',['共享图片、视频与案例素材库','多语言目录与内容模板','独立站与询盘表单','店铺商品与渠道关联','发布计划与内容审核']],
['数据分析与复盘','哪些投入带来有效生意',['客户阶段与基础统计','渠道来源与有效线索质量','触达、回复与询盘漏斗','报价成交与团队表现','成本、ROI 与策略复盘']],
['系统设置与集成','如何安全持续运行',['账号、角色与数据权限','账号连接与数据源配置','后端、数据库与任务队列','备份恢复与操作日志','数据保留、退订与来源管理','CI/CD、部署与运行监控']]]
const initial=seeds.map((m,i)=>({id:`m${i}`,name:m[0],goal:m[1],features:m[2].map((name,j)=>({id:`m${i}-${j}`,name,status:'待开发',note:''}))}))
// Status describes actual capability rather than the presence of a menu.
for(const [i,j] of [[0,0],[1,0],[2,1],[2,4],[2,5],[3,1],[4,0],[4,1],[5,0],[5,1],[6,0],[6,1],[6,2],[6,3],[7,0],[7,1],[7,2],[7,3],[7,8],[9,0],[10,1]]){initial[i!]!.features[j!]!.status='原型 / 模拟'}
initial[10]!.features[5]!.status='部分完成';initial[10]!.features[5]!.note='已配置 GitHub Actions；部署及运行监控仍需验证完善。'
for(const i of [8])for(const f of initial[i]!.features)f.status='后期规划'
for(const j of [4,5,6])initial[7]!.features[j]!.status='后期规划'
function restore():Module[]{try{const data=JSON.parse(localStorage.getItem('yt-feature-map-v1')||'null');if(Array.isArray(data)&&data.every(m=>typeof m.name==='string'&&Array.isArray(m.features)))return data}catch{}return initial}
const modules=ref<Module[]>(restore()),expanded=ref<string[]>(['m2','m7']),query=ref(''),state=ref('全部状态'),target=ref('m2'),idea=ref(''),feedback=ref('')
watch(modules,()=>localStorage.setItem('yt-feature-map-v1',JSON.stringify(modules.value)),{deep:true})
const states=['待开发','原型 / 模拟','部分完成','已完成','后期规划']
const filtered=computed(()=>modules.value.map(m=>({...m,features:m.features.filter(f=>(state.value==='全部状态'||f.status===state.value)&&(!query.value||(m.name+f.name+f.note).toLowerCase().includes(query.value.toLowerCase())))})).filter(m=>m.features.length))
const total=computed(()=>modules.value.reduce((n,m)=>n+m.features.length,0))
function toggle(id:string){expanded.value=expanded.value.includes(id)?expanded.value.filter(x=>x!==id):[...expanded.value,id]}
function add(){const m=modules.value.find(m=>m.id===target.value);if(!m||!idea.value.trim())return;m.features.push({id:crypto.randomUUID(),name:idea.value.trim(),status:'待开发',note:''});expanded.value.push(m.id);idea.value='';query.value='';state.value='全部状态';feedback.value=`已加入「${m.name}」，保存在当前浏览器`}
function exportMap(){const blob=new Blob([JSON.stringify({version:1,modules:modules.value},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='悦拓功能路线图.json';a.click();URL.revokeObjectURL(a.href)}
</script>
<template>
<section class="map-intro panel"><div><span class="tag">产品全景 · 持续更新</span><h2>一张图，找到每个想法的位置</h2><p>找客户 → 判断价值 → 触达沟通 → 跟进转化 → 沉淀复盘</p></div><div class="map-summary"><b>{{modules.length}}</b> 个模块 <b>{{total}}</b> 个功能节点<button @click="exportMap">导出路线图 ↓</button></div></section>
<form class="idea-form panel" @submit.prevent="add"><div><h2>＋ 记录新想法</h2><p>先选归属模块，再写功能；后续可以补说明和调整状态。</p></div><select v-model="target" aria-label="想法归属模块"><option v-for="m in modules" :value="m.id">{{m.name}}</option></select><input v-model="idea" required maxlength="160" placeholder="例如：客户回复后自动提醒负责人" aria-label="新功能想法"/><button class="primary">加入功能树</button></form>
<p v-if="feedback" role="status" class="notice">{{feedback}}</p>
<div class="map-toolbar"><input v-model="query" placeholder="搜索模块、功能或说明…" aria-label="搜索功能"/><select v-model="state" aria-label="筛选开发状态"><option>全部状态</option><option v-for="s in states">{{s}}</option></select><button @click="expanded=modules.map(m=>m.id)">全部展开</button><button @click="expanded=[]">全部收起</button></div>
<div class="map-root"><b>YUETUO 悦拓箱包</b><span>外贸获客与 AI 协作系统</span></div>
<div class="feature-tree"><section v-for="(m,i) in filtered" :key="m.id" class="module-branch" :style="{'--branch-color':['#c5e9df','#cbe8f5','#f5d2e3','#ded7f2','#f8edbc'][i%5]}"><button class="module-node" :aria-expanded="expanded.includes(m.id)||!!query||state!=='全部状态'" @click="toggle(m.id)"><span class="module-number">{{String(modules.findIndex(x=>x.id===m.id)+1).padStart(2,'0')}}</span><span><b>{{m.name}}</b><small>{{m.goal}}</small></span><em>{{m.features.length}} 项</em><span>{{expanded.includes(m.id)||query||state!=='全部状态'?'−':'＋'}}</span></button><div v-if="expanded.includes(m.id)||query||state!=='全部状态'" class="feature-leaves"><article v-for="f in m.features" :key="f.id" class="feature-leaf"><div class="feature-leaf-heading"><b>{{f.name}}</b><select v-model="f.status" :aria-label="f.name+'开发状态'" :class="{'completed':f.status==='已完成'}"><option v-for="s in states">{{s}}</option></select></div><input v-model="f.note" :aria-label="f.name+'说明'" placeholder="补充需求、验收标准或下一步…"/></article></div></section></div>
<div v-if="!filtered.length" class="panel empty">没有找到匹配功能，试试其他关键词。</div>
<p class="map-help">状态说明：「原型 / 模拟」表示已有演示界面，不代表真实服务可用。想法、说明与状态自动保存在当前浏览器，可导出备份；尚未支持团队同步。已有功能归类可在后续开发中调整。</p>
</template>
<style scoped>
.map-intro{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(115deg,#eff8f2,#f3eef9)}.map-intro h2{font-size:21px;margin:15px 0 8px}.map-summary{display:flex;align-items:center;gap:10px;font-size:12px;flex-wrap:wrap}.map-summary b{font-size:27px}.idea-form{display:flex;align-items:center;gap:14px;margin:20px 0}.idea-form>div{min-width:210px}.idea-form p{margin-bottom:0}.idea-form input{flex:1;min-width:100px}.idea-form select{max-width:190px}.map-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin:24px 0}.map-toolbar input{min-width:250px}.map-root{background:#2d5d59;color:#fff;padding:22px 25px;border-radius:6px;display:flex;gap:20px;align-items:center;max-width:580px;margin:28px 0}.map-root span{font-size:12px;color:#cde6db}.feature-tree{border-left:2px solid #dce6df;margin-left:27px;padding-left:32px}.module-branch{position:relative;margin-bottom:16px}.module-branch:before{content:'';position:absolute;width:32px;height:2px;background:#dce6df;left:-34px;top:34px}.module-node{display:flex;text-align:left;align-items:center;width:100%;gap:15px;padding:15px 19px;background:#fff;border:1px solid #e0e8e2;border-left:5px solid var(--branch-color);border-radius:6px}.module-number{background:var(--branch-color);width:34px;height:34px;display:grid;place-items:center;font-size:12px;border-radius:4px}.module-node b{font-size:14px}.module-node small{display:block;font-size:11px;color:#7a8b81;margin-top:6px}.module-node em{margin-left:auto;color:#829288;white-space:nowrap}.feature-leaves{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:15px 0 10px 28px;border-left:2px solid var(--branch-color);margin-left:23px}.feature-leaf{border:1px solid #e3e9e4;border-radius:5px;background:#fff;padding:15px}.feature-leaf-heading{display:flex;align-items:center;gap:12px;justify-content:space-between}.feature-leaf b{font-size:12px;font-weight:500;line-height:1.7}.feature-leaf select{font-size:10px;padding:5px;background:#f7f5ee;border:0;min-width:100px}.feature-leaf select.completed{background:#def1e6;color:#377555}.feature-leaf input{border:0;border-top:1px solid #f0f2ef;border-radius:0;font-size:11px;padding:12px 0 2px;width:100%;margin-top:10px;color:#647c6e}.map-help{font-size:11px;line-height:1.9;margin-top:24px}@media(max-width:1150px){.idea-form{flex-wrap:wrap}.idea-form>div{width:100%}.map-intro{align-items:flex-start;flex-direction:column}.feature-leaves{grid-template-columns:1fr}}@media(max-width:700px){.feature-tree{margin-left:8px;padding-left:15px}.module-branch:before{left:-17px;width:15px}.module-node{gap:8px;padding:13px 10px}.module-node small{font-size:10px}.module-node b{font-size:12px}.feature-leaves{padding-left:10px;margin-left:10px}.map-root{flex-direction:column;align-items:flex-start;gap:8px}.idea-form input{width:100%;flex-basis:100%}.idea-form select{max-width:100%;width:100%}.feature-leaf-heading{flex-wrap:wrap}.map-toolbar input{min-width:0;width:100%}}
</style>
