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

## 本地后端 + 远程 MySQL + COS

1. 在服务器建立独立数据库 `yuetuo_trade`，准备专用账号，仅授权该数据库。迁移账号需要建表权限。
2. 复制 `.env.example` 为 `.env`，填写数据库与 COS 配置，并生成随机 API_TOKEN。所有密钥只在后端使用。
3. 推荐通过 SSH 隧道连接：`ssh -N -L 3307:127.0.0.1:3306 your-ssh-alias`。若 MySQL 在容器中，请按实际宿主机映射端口调整。无需对公网开放 3306。
4. 在项目目录运行 `npm run db:migrate`，仅创建 `yt_customers` 和 `yt_followups` 两张表。
5. 运行 `npm run dev:all`（或分别启动前端与 `npm run dev:api`）。API 仅监听本机 127.0.0.1:3001。
6. 系统设置 → 本地后端连接验证：检测、填写令牌、写入并读取真实客户、上传文件。

当前真实 API 验证区与模拟 CRM 独立；不自动迁移 localStorage，不宣称整个 CRM 已完成远程持久化。正式用户登录、权限和其余模块的数据库迁移为后续任务。此后端仅用于本机开发，不可直接公开部署。

COS 使用私有 Bucket 和仅限目标目录的子账号权限，支持 PNG/JPEG/PDF（10MB），后端生成对象 Key，返回 5 分钟签名预览 URL。文件 Key 后续需关联产品或附件表；当前验证接口尚未建立业务关联。COS 配置状态不代表真实上传已通过。不要将 Bucket 改成公开读写。

GitHub Pages 仍为模拟前端展示，不提供本地 API。服务器连接、COS 验证需在 Mac 本地环境完成。

COS 上传目录使用 `COS_PREFIX=trade`，对象路径为 `trade/日期/随机文件名`。`COS_CUSTOM_DOMAIN` 仅预留配置，当前仍使用 COS 签名链接，未启用自定义域名访问。

## 真实 CRM（本地开发）

先执行 `npm run db:migrate`，再执行 `npm run dev:all`。客户 CRM 菜单已切换为真实 MySQL 数据，工作台及独立演示跟进中心仍为模拟数据。不会自动导入演示客户。

Vite 开发代理在服务端注入 `.env` 的 API_TOKEN，令牌不会进入浏览器构建产物。更改令牌后须重启 Vite。API 仅监听回环地址，当前不是多用户登录系统，不能直接作为公网服务。

接口：
- GET /api/customers?q=&stage=&page=：分页（每页 20 条），返回 items/total/page/pageSize。
- POST /api/customers：创建客户；PUT /api/customers/:id：完整编辑；GET /api/customers/:id：详情。
- GET/POST /api/customers/:id/contacts：联系人列表与新增。
- GET/POST /api/customers/:id/followups：跟进列表与新增。

字段校验、参数化 SQL、不存在客户 404 和错误提示已实现。联系人和跟进通过外键关联客户；不提供删除客户接口，避免误删业务资产。迁移可重复执行，只新增不存在的 yt_ 表，不修改既有其他表。

`npm run test:api` 使用配置的真实数据库进行集成验证，临时启动 3107 端口，创建带 __API_TEST_ 前缀的客户，测试后仅清理此次创建的数据。此命令不在 CI 自动执行，避免 CI 访问生产凭据。
