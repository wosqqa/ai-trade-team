import 'dotenv/config';
import mysql from 'mysql2/promise';
import {readFileSync} from 'node:fs';
export const configured=Boolean(process.env.DB_USER&&process.env.DB_NAME&&process.env.DB_PASSWORD);
export const pool=configured?mysql.createPool({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3307),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,connectionLimit:4,connectTimeout:8000,charset:'utf8mb4',ssl:process.env.DB_SSL_CA?{ca:readFileSync(process.env.DB_SSL_CA),rejectUnauthorized:true}:undefined}):null;
export async function db(){if(!pool)throw Object.assign(new Error('请先填写 MySQL 配置'),{status:503});return pool}
