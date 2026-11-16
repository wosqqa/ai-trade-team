# 社媒店铺获客需求

核心客户：海外经营箱包及相关品类的中小店主、社媒卖家、独立网店。童装、文具、礼品等相邻品类是否纳入任务，由实际产品与国家配置决定。

优先流程：公开搜索发现店铺 → 导入主页链接 → 公开经营证据整理 → 产品及 MOQ 匹配 → 人工审核 → CRM。不是自动群发流程。

渠道预留 Instagram、Facebook、TikTok；先做搜索引擎已索引公开页面与人工链接导入。逐个平台验证官方 API 能力及授权，不能把用户授权资料 API 当成任意商家搜索接口。不采集私信、私人通讯录或绕过访问控制。尚未接入真实数据源。

线索模型预留 platform、profile_url、handle、shop_url、country、category、public_business_email、public_business_phone、source_url、evidence、observed_at、last_active_at（有证据才填）、match_reason、review_status、customer_id。未知信息保持空值。粉丝数仅辅助参考，不等于采购能力；经营相关商品不等于存在采购意向。

去重：同平台规范化主页 URL；跨平台按官网或公开商务信息提示人工合并，不仅凭店名自动合并。审核入库需要记录来源与证据，并保证重复操作不重复创建客户。

下一阶段：确认首个目标国家、商品品类和数据服务预算；实现任务、线索、来源证据表及审核入库接口，再接搜索服务。不得把演示线索直接写进正式 CRM。

## 已实现第一阶段

真实 MySQL 方案、任务、线索与来源关系；公开主页单条/批量导入、URL 规范化、规则评分、人工审核、CRM 入库及来源追溯。Brave 公开搜索适配器与单进程 Worker 已开发，需配置凭据及额度开关后进行实网验收，尚未调用。未实现平台账号授权、官网深度爬取、AI 背调、联系人自动验证及全自动发送。

Brave API 接口依据：https://api-dashboard.search.brave.com/app/documentation/web-search 。
