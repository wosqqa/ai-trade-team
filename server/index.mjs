import express from 'express';
import {maps,startMaps} from './maps.mjs';
import {closeLocalBrowser} from './browser-search.mjs';
import {enrichment} from './enrichment.mjs';
import {discovery,startDiscovery} from './discovery.mjs';
import {crm} from './crm.mjs';
import multer from 'multer';
import COS from 'cos-nodejs-sdk-v5';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {db,configured,pool} from './db.mjs';
const app=express();app.use(express.json({limit:'256kb'}));
const cosReady=Boolean(process.env.COS_SECRET_ID&&process.env.COS_SECRET_KEY&&process.env.COS_BUCKET&&process.env.COS_REGION);
const cos=cosReady?new COS({SecretId:process.env.COS_SECRET_ID,SecretKey:process.env.COS_SECRET_KEY}):null;
app.use((req,res,next)=>{const origin=req.headers.origin;if(origin&&!/^http:\/\/(localhost|127\.0\.0\.1):(5173|3001)$/.test(origin))return res.status(403).json({error:'来源不允许'});next()});
app.get('/api/health',async(req,res)=>{let database='未配置';if(configured){try{await pool.query('SELECT 1');database='已连接'}catch{database='连接失败'}}res.json({service:'yuetuo-api',database,cos:cosReady?'已配置，尚需上传验证':'未配置'})});
app.use('/api',(req,res,next)=>{const token=process.env.API_TOKEN;const supplied=req.headers.authorization?.replace(/^Bearer /,'')||'';if(!token)return res.status(503).json({error:'请配置 API_TOKEN'});const a=Buffer.from(token),b=Buffer.from(supplied);if(a.length!==b.length||!timingSafeEqual(a,b))return res.status(401).json({error:'请填写本机 API 访问令牌'});next()});
app.use('/api',crm);
app.use('/api/discovery',discovery);
app.use('/api/discovery',enrichment);
app.use('/api/maps',maps);
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1}});
app.post('/api/files',upload.single('file'),async(req,res)=>{if(!cos)return res.status(503).json({error:'COS 尚未配置'});const file=req.file;if(!file)return res.status(400).json({error:'请选择文件'});const b=file.buffer;const ext=b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':b[0]===255&&b[1]===216&&b[2]===255?'jpg':b.subarray(0,5).toString()==='%PDF-'?'pdf':null;if(!ext)return res.status(400).json({error:'仅支持 PNG、JPEG、PDF'});const prefix=(process.env.COS_PREFIX||'trade').replace(/^\/+|\/+$/g,'');const Key=`${prefix}/${new Date().toISOString().slice(0,10)}/${randomUUID()}.${ext}`;await cos.putObject({Bucket:process.env.COS_BUCKET,Region:process.env.COS_REGION,Key,Body:b,ContentType:ext==='pdf'?'application/pdf':`image/${ext==='jpg'?'jpeg':'png'}`});const url=cos.getObjectUrl({Bucket:process.env.COS_BUCKET,Region:process.env.COS_REGION,Key,Sign:true,Expires:300});res.status(201).json({key:Key,url,expiresIn:300})});
app.use((err,req,res,next)=>{console.error('API error:',err.code||err.name);res.status(err.status|| (err instanceof multer.MulterError?400:500)).json({error:err.status?err.message:'操作失败，请检查服务配置或输入；未切换为模拟数据'})});
const server=app.listen(Number(process.env.API_PORT||3001),'127.0.0.1',()=>console.log('悦拓 API: http://127.0.0.1:3001'));
process.on('SIGTERM',()=>server.close(async()=>{await closeLocalBrowser();await pool?.end();process.exit()}));

if(process.env.DISCOVERY_WORKER!=='false'){startDiscovery();startMaps()}
