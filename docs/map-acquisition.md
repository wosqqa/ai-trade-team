# 地图商家获客：实现与验收边界

## 数据源决定

Google Maps / Places 保留为获客方向和人工查看入口，不将它当成可直接批量复制到 CRM 的开放数据。官方政策限制内容缓存与存储，place_id 例外不能推导成商家名称、电话等都可永久保存。

官方资料：
- https://developers.google.com/maps/documentation/places/web-service/policies
- https://cloud.google.com/maps-platform/terms （3.2.3）

当前可执行地图来源为 OpenStreetMap，通过 Overpass 只读查询。与 Google Maps 是不同数据源，界面明确区分。ODbL 来源资料保留在独立线索与证据记录，展示 attribution；后续若公开发布衍生数据库，须按许可要求评估分享义务，不自动将全部 CRM 私有备注公开。

来源：
- https://www.openstreetmap.org/copyright
- https://osmfoundation.org/wiki/Licence_and_Legal_FAQ
- https://dev.overpass-api.de/overpass-doc/en/preface/commons.html

## 功能

- 尼日利亚城市：Lagos、Abuja、Ibadan，使用明确固定查询范围，不宣称覆盖整个城市或全国。
- 类型：箱包、文具、母婴、玩具、服装。类别仅作线索，不证明经营书包、三件套或存在采购需求。
- 每任务 1–50 家上限，最多 3 个城市查询；地图对象按 type/id 唯一键去重。
- 保存店名、来源、登记联系方式、来源声明。score=0，不从地图标签伪造采购评分。
- 可选择官网补全邮箱；未核实的电话不标成 WhatsApp。
- 官网访问：检查 robots.txt，仅公开 HTTP(S)，DNS 全量检查并绑定已验证公网 IP，限制端口、大小、重定向、超时；访问失败保留线索。
- 全部线索进入已有审核流程，联系方式须人工核对，CRM 保留来源。重复审核与联系人匹配仍使用事务和串行锁。
- 失败记录不删除、不用模拟结果填充；重试须人工发起。公共服务无 SLA，实际覆盖和可用性必须实测。

## 配置

OVERPASS_ENDPOINT 为后台管理员配置，不接受前端 URL 输入。默认使用官方实例列表所列 Private.coffee 只读实例（原 Kumi 域名已迁移）；可替换经确认可用的自建或托管服务。

MAPS_DAILY_REQUEST_LIMIT 默认 12，限制地图请求。当前统计按 UTC 日期内更新的地图任务累计调用次数，重试跨日可能保守计入历史调用；不是供应商计费账单。生产扩容前应改为独立请求流水表与更精细预算。

GET /api/maps/capabilities 查看元数据；POST /api/maps/tasks 创建独立方案快照和队列任务。任务和线索使用 /api/discovery/tasks/:id 查询和既有审核入库接口。

## 测试

`node server/tests/maps.mjs` 验证参数、查询白名单、私有地址拒绝、robots 限制、任务写入、重复对象去重、来源与官网信息保留；使用注入测试数据，不调用公共地图服务，结束后清理本次测试行。

2026-11-16 实网记录：公共 overpass-api.de 返回 HTTP 406；Kumi 首次要求提供明确 User-Agent，按要求标识应用后出现请求超时。已发起真实应用任务，实际状态保留在数据库。不应因单元/集成测试通过而宣称实网获客已验收。

最后实网结果：应用任务使用当前 Private.coffee 地址重试后仍因连接超时失败，保留 0 条线索、2 次请求记录。地图执行链已实现，但本机网络到公共服务的可用性未通过验收；不能称为已打通稳定自动获客。

回归中修复了测试隔离问题：注入测试搜索函数必须指定唯一测试任务 ID，不能扫描已有队列。发现并清理了误写到真实任务中的 2 条明确命名为 Mock result 的测试线索，将受影响任务标为失败并说明需真实重跑；未修改真实客户表。新增“更早排队任务保持不变”的回归断言。
