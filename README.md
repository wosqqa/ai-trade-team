# 悦拓箱包 AI 外贸获客系统 V1.0

Vue 3 + TypeScript + Vite 中文响应式前端，当前使用模拟数据，未连接真实账号或后台 Agent。

## 本地开发

需要 Node.js 22.12+（CI 使用 Node.js 22）。

```bash
npm ci
npm run dev
```

客户及跟进记录保存在当前浏览器 localStorage，请勿在公开演示环境录入敏感资料。

## 检查与构建

```bash
npm run build
npm run preview
```

## CI/CD

- `.github/workflows/ci.yml`：push、PR 和手动触发，安装锁定依赖、TypeScript 检查、生产构建并保存产物。
- `.github/workflows/deploy.yml`：main 更新或手动触发时构建并部署前端到 GitHub Pages。构建失败不会执行部署。
- 仓库 Settings → Pages → Build and deployment → Source 选择 GitHub Actions。
- 预计预览地址：https://wosqqa.github.io/ai-trade-team/ （首次部署成功后可用）。
- GitHub Pages 仅提供静态前端。未来后端、数据库、任务队列、密钥和 Agent 服务需要独立部署。
- 不要在源码或 VITE_ 环境变量中存放密钥；VITE_ 值会进入浏览器构建产物。

## 模块

工作台、协作指挥中心、产品知识库、客户挖掘与审核入库、CRM、AI 任务、跟进草稿、商机看板、统计、系统设置。店铺、视频和广告 Agent 为后续规划入口。
