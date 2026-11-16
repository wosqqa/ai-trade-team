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

## 真实客户挖掘中心

运行数据库迁移后可使用获客方案、任务与线索审核。预设方向为 Nigeria / 书包、拉杆包三件套 / 海外中小店主，具体套装组成、MOQ、价格仍待确认。

- 默认入口为公开搜索辅助与店铺主页资料导入。系统不抓取输入 URL；仅保存用户提供的公开证据。支持单条和批量 JSON，规范化主页链接、同任务去重、跨任务审核后关联同一 CRM 客户。
- 规则分数：产品线索 40、地区线索 25、售卖线索 20，最高 85，不代表采购意向。国家在审核时人工确认；搜索摘要不是完成的企业背调。
- 保存方案后创建任务，任务保留配置快照。审核入库采用事务，重复操作不重复建客户，来源可在真实 CRM 的客户详情查看。无匹配结果不填充模拟数据。
- 自动检索采用 Brave Web Search API（公开索引，不是 Meta/TikTok 内部数据库），需后端配置 BRAVE_SEARCH_API_KEY 与 SEARCH_ALLOW_CALLS=true。未配置时禁用。每任务/重试每个平台至多一次请求、每次最多 20 条，最多 3 个平台；不保证达到目标数量。记录调用次数而非虚构实际费用；价格、额度以所购服务为准。
- 本地单进程 Worker 每 3 秒检查队列。失败需手动重试，重启中断任务标为失败并保留线索；不做未经确认的自动收费重试。仅在 Mac 和后端运行时执行。
- `npm run test:discovery` 使用临时方案与线索测试完整流程、幂等与失败恢复，搜索提供方使用测试桩，不调用收费服务，测试结束清理本次数据。请勿并行运行多套后端任务执行器。

接口位于 `/api/discovery`：GET capabilities/plans/tasks、POST plans/tasks、GET tasks/:id、POST tasks/:id/import、POST tasks/:id/retry、POST leads/:id/review。客户来源查询：GET /api/customers/:id/sources。

## 店铺公开联系方式与客户去重

线索详情支持：尝试读取公开主页 → 提取候选邮箱和电话 → 人工核对保存 → 审核入库。直接读取仅访问固定平台 HTTPS 主机，不携带账号、不跟随重定向、不绕过登录或验证码；读取受阻显示原因，可粘贴店铺公开简介提取。搜索任务启用后会对新线索尝试补全公开资料；未找到不等于没有。

- 仅从公开文本提取；不推测邮箱，不把电话自动标为 WhatsApp。地址和 Instagram 由人工核实填写。邮箱、电话未做实际送达或号码归属验证。
- 客户表新增 phone / whatsapp / address / instagram。CRM 可按邮箱、电话查询，并提供 mailto、tel、wa.me 和主页来源入口。
- 已核对的联系方式随审核保存到客户表。主页唯一键、统一小写邮箱、国际号码共同查重；匹配同一客户只补空字段，不覆盖已有值。不同依据分别命中多个客户则拒绝自动合并。CRM 新增编辑也检查联系方式冲突。
- Facebook people/name/id、纯数字主页和 profile.php?id 的同一数字 ID 使用相同唯一键。搜索结果中能明确识别店主路径的 /店名/posts/... 或 /店名/videos/... 会归到对应主页；无法确定店主的帖子不猜测归属。
- 全局 MySQL advisory lock 串行化客户保存/审核，配合事务避免不同任务同时重复建客户；仅以同名不能自动合并。历史联系方式若不是经本接口规范化保存，应先人工清洗。
- 新增 API：POST /api/discovery/leads/:id/enrich、POST .../extract（公开文本）、PUT .../contact（人工核对字段）。证据保留在联系资料原文，不保存社媒登录凭据。
