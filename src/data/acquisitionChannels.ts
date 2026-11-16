export const acquisitionChannels = [
  {id:'social',name:'社媒店铺',detail:'Facebook / Instagram / TikTok：发现中小店主、查看公开产品与商务联系资料。',status:'部分实现 · 自动获取未验收',priority:'当前重点',fields:'主页、产品证据、公开邮箱 / 电话 / WhatsApp',requirement:'稳定搜索数据源；平台公开访问或授权接口'},
  {id:'maps',name:'地图商家（含 Google Maps 方向）',detail:'按城市与店铺品类找商家。当前执行器使用 OpenStreetMap，Google Maps 未接入。',status:'开放地图执行器已开发 · 实网待验收',priority:'优先补充',fields:'店名、地址、电话、官网、来源链接',requirement:'公共接口有覆盖与可用性限制；Google 数据存储需单独核对许可'},
  {id:'companies',name:'全球企业库',detail:'补充零售商、独立网店、批发商和进口商的企业与商务资料。',status:'待接入',priority:'补充方向',fields:'企业主体、行业、规模、网站、商务联系人',requirement:'企业数据服务授权及字段覆盖核验'},
  {id:'linkedin',name:'LinkedIn',detail:'查找店主、创始人、采购负责人，补充职位与企业关系。',status:'待接入',priority:'补充方向',fields:'企业主页、公开职业资料、岗位、来源证据',requirement:'可用授权接口、合法数据服务或资料导入'},
  {id:'exhibitions',name:'展会名录',detail:'从箱包、礼品、母婴、文具展的公开名录中寻找相关商家。',status:'待接入',priority:'补充方向',fields:'展会、年份、商家、角色、官网与公开联系方式',requirement:'名录来源与使用权限；区分参展商和采购商'},
  {id:'customs',name:'海关数据',detail:'根据产品 / HS 编码分析进口商、采购记录、频次及供应商。',status:'待接入',priority:'后续验证',fields:'进口商、产品、日期、采购记录、数据覆盖范围',requirement:'海关数据服务；明确国家覆盖、更新时间与费用'},
] as const
