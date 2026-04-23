// Mock data for the Social Media Rankings (社媒榜单) theme.
// Five board categories: 实时榜 / 旅游榜 / 同城榜 / 景点榜 / 酒店榜

export type BoardCategory = "realtime" | "travel" | "city" | "attractions" | "hotels";

export const BOARD_CATEGORIES: { key: BoardCategory; label: string; desc: string; tip: string; icon: string }[] = [
  { key: "realtime",    label: "社媒实时榜",   desc: "抖音 / 微博 / 百度 / 快手 实时热点话题", tip: "数据每 30 分钟更新", icon: "🔥" },
  { key: "travel",      label: "社媒旅游榜",   desc: "微博、小红书、抖音 旅游相关榜单",       tip: "小红书每日 12 点更新昨日数据；微博每日 12 点更新当日数据", icon: "✈️" },
  { key: "city",        label: "社媒同城榜",   desc: "微博、抖音 同城热点（按城市筛选）",     tip: "实时更新，可手动刷新", icon: "🏙️" },
  { key: "attractions", label: "景点榜",       desc: "全国/省份热门景点热度榜",               tip: "日榜 T-2，每日 12 点更新前日数据；月榜每月 1 号更新", icon: "🏞️" },
  { key: "hotels",      label: "酒店榜",       desc: "全国/省份热门酒店热度榜",               tip: "日榜 T-2，每日 12 点更新前日数据；月榜每月 1 号更新", icon: "🏨" },
];

export type RankSource =
  // realtime
  | "douyin_realtime" | "weibo_realtime" | "baidu_realtime" | "kuaishou_realtime"
  // travel
  | "weibo_travel" | "xhs_travel" | "douyin_travel"
  // city (微博同城 / 抖音同城)
  | "weibo_city" | "douyin_city"
  // POI
  | "attraction_board" | "hotel_board";

export interface RankSourceMeta {
  key: RankSource;
  platform: "抖音" | "微博" | "小红书" | "百度" | "快手" | "综合";
  board: string;
  shortLabel: string;
  category: BoardCategory;
  cls: string;
  dot: string;
}

export const RANK_SOURCES: Record<RankSource, RankSourceMeta> = {
  douyin_realtime:   { key: "douyin_realtime",   platform: "抖音",   board: "实时榜",   shortLabel: "抖音·实时",     category: "realtime",    cls: "bg-slate-900 text-white",                              dot: "bg-slate-900" },
  weibo_realtime:    { key: "weibo_realtime",    platform: "微博",   board: "实时榜",   shortLabel: "微博·实时",     category: "realtime",    cls: "bg-rose-100 text-rose-700 border border-rose-200",     dot: "bg-rose-500" },
  baidu_realtime:    { key: "baidu_realtime",    platform: "百度",   board: "实时榜",   shortLabel: "百度·实时",     category: "realtime",    cls: "bg-blue-100 text-blue-700 border border-blue-200",     dot: "bg-blue-500" },
  kuaishou_realtime: { key: "kuaishou_realtime", platform: "快手",   board: "实时榜",   shortLabel: "快手·实时",     category: "realtime",    cls: "bg-orange-100 text-orange-700 border border-orange-200", dot: "bg-orange-500" },

  weibo_travel:      { key: "weibo_travel",      platform: "微博",   board: "旅游榜单", shortLabel: "微博·旅游",     category: "travel",      cls: "bg-rose-100 text-rose-700 border border-rose-200",     dot: "bg-rose-500" },
  xhs_travel:        { key: "xhs_travel",        platform: "小红书", board: "旅游榜单", shortLabel: "小红书·旅游",   category: "travel",      cls: "bg-pink-100 text-pink-700 border border-pink-200",     dot: "bg-pink-500" },
  douyin_travel:     { key: "douyin_travel",     platform: "抖音",   board: "旅游榜单", shortLabel: "抖音·旅游",     category: "travel",      cls: "bg-slate-100 text-slate-800 border border-slate-300",  dot: "bg-slate-700" },

  weibo_city:        { key: "weibo_city",        platform: "微博",   board: "同城榜",   shortLabel: "微博·同城",     category: "city",        cls: "bg-rose-100 text-rose-700 border border-rose-200",     dot: "bg-rose-500" },
  douyin_city:       { key: "douyin_city",       platform: "抖音",   board: "同城榜",   shortLabel: "抖音·同城",     category: "city",        cls: "bg-slate-100 text-slate-800 border border-slate-300",  dot: "bg-slate-700" },

  attraction_board:  { key: "attraction_board",  platform: "综合",   board: "景点榜",   shortLabel: "景点榜",         category: "attractions", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  hotel_board:       { key: "hotel_board",       platform: "综合",   board: "酒店榜",   shortLabel: "酒店榜",         category: "hotels",      cls: "bg-violet-100 text-violet-700 border border-violet-200",   dot: "bg-violet-500" },
};

export type TrendDir = "up" | "down" | "flat" | "new" | "boom";
export type TopicCategory =
  | "明星娱乐" | "旅游目的地" | "节假出行" | "社会民生" | "美食"
  | "酒店住宿" | "交通出行" | "户外活动" | "文化展览" | "演出活动";

export interface RankTopic {
  id: string;
  title: string;
  summary: string;
  category: TopicCategory;
  source: RankSource;
  rank: number;
  prevRank?: number;
  trend: TrendDir;
  heat: number;
  heatTrend: number;
  duration: string;
  firstSeen: string;
  travelRelated: boolean;
  crossSources: RankSource[];
  keywords: string[];
  /** 同城榜专用 */
  city?: string;
  /** 景点/酒店榜专用 */
  poiName?: string;
  poiRegion?: string;
  poiThumb?: string;
  /** 相关帖子（同城/景点/酒店榜显示） */
  relatedPosts?: { title: string; author: string }[];
}

const post = (title: string, author: string) => ({ title, author });

export const rankTopics: RankTopic[] = [
  // ─── 实时榜 ───────────────────────────────────────
  // 抖音实时
  { id: "r1",  title: "周杰伦上海演唱会现场",         summary: "嘉年华世界巡演上海三场连开,粉丝实拍片段刷屏",   category: "明星娱乐",   source: "douyin_realtime",   rank: 1,  prevRank: 3,  trend: "up",   heat: 1287000, heatTrend: 245, duration: "8h",  firstSeen: "2026-04-15 14:20", travelRelated: true,  crossSources: ["douyin_realtime","weibo_realtime","baidu_realtime"], keywords: ["周杰伦","上海","演唱会"] },
  { id: "r2",  title: "五一假期出行高峰预警",         summary: "全国铁路客流预计创历史新高,多地发布出行提示",   category: "节假出行",   source: "douyin_realtime",   rank: 2,  prevRank: 5,  trend: "up",   heat: 980000,  heatTrend: 178, duration: "12h", firstSeen: "2026-04-15 09:00", travelRelated: true,  crossSources: ["douyin_realtime","weibo_realtime","weibo_travel","baidu_realtime"], keywords: ["五一","出行","高铁"] },
  { id: "r3",  title: "淄博烧烤回归热度",             summary: "进入春季淄博烧烤话题再次走高,商家备货",          category: "美食",      source: "douyin_realtime",   rank: 5,  prevRank: 2,  trend: "down", heat: 760000,  heatTrend: -32, duration: "3d",  firstSeen: "2026-04-12 18:00", travelRelated: true,  crossSources: ["douyin_realtime","xhs_travel"], keywords: ["淄博","烧烤","美食"] },
  { id: "r4",  title: "日本樱花季签证排队",           summary: "多领事馆出现签证排队,网友吐槽预约难",            category: "交通出行",   source: "douyin_realtime",   rank: 8,  trend: "new",  heat: 540000,  heatTrend: 0,   duration: "1h",  firstSeen: "2026-04-15 21:00", travelRelated: true,  crossSources: ["douyin_realtime"], keywords: ["日本","樱花","签证"] },

  // 微博实时
  { id: "r10", title: "#五一返程机票退改#",            summary: "用户大量反映退改难、客服占线,投诉量激增",        category: "交通出行",   source: "weibo_realtime",    rank: 1,  prevRank: 4,  trend: "boom", heat: 894000,  heatTrend: 412, duration: "6h",  firstSeen: "2026-04-15 16:00", travelRelated: true,  crossSources: ["weibo_realtime","douyin_realtime"], keywords: ["五一","机票","退改"] },
  { id: "r11", title: "#薛之谦北京演唱会#",            summary: "鸟巢双场开票即售罄,黄牛话题登上热搜",            category: "明星娱乐",   source: "weibo_realtime",    rank: 3,  prevRank: 7,  trend: "up",   heat: 768000,  heatTrend: 178, duration: "1d",  firstSeen: "2026-04-14 20:00", travelRelated: true,  crossSources: ["weibo_realtime","douyin_realtime"], keywords: ["薛之谦","北京","鸟巢"] },
  { id: "r13", title: "#高铁霸座新规#",                summary: "新规实施引发广泛讨论,多个案例登上热搜",          category: "社会民生",   source: "weibo_realtime",    rank: 9,  trend: "new",  heat: 432000,  heatTrend: 0,   duration: "2h",  firstSeen: "2026-04-15 19:30", travelRelated: false, crossSources: ["weibo_realtime"], keywords: ["高铁","霸座","新规"] },

  // 百度实时
  { id: "r30", title: "全国5G基站总数已达495.8万个",   summary: "工信部发布最新数据,5G建设持续推进",              category: "社会民生",   source: "baidu_realtime",    rank: 1,  prevRank: 2,  trend: "up",   heat: 1209500, heatTrend: 35,  duration: "5h",  firstSeen: "2026-04-15 17:00", travelRelated: false, crossSources: ["baidu_realtime","weibo_realtime"], keywords: ["5G","基站","工信部"] },
  { id: "r31", title: "特朗普延长停火期限",             summary: "国际新闻,引发全球关注",                           category: "社会民生",   source: "baidu_realtime",    rank: 2,  prevRank: 1,  trend: "down", heat: 1112000, heatTrend: -12, duration: "1d",  firstSeen: "2026-04-14 22:00", travelRelated: false, crossSources: ["baidu_realtime"], keywords: ["特朗普","停火","国际"] },
  { id: "r32", title: "云南目瑙纵歌节场面太震撼",       summary: "景颇族传统节日,百度搜索热度飙升",                category: "节假出行",   source: "baidu_realtime",    rank: 3,  trend: "new",  heat: 1020300, heatTrend: 0,   duration: "3h",  firstSeen: "2026-04-15 19:00", travelRelated: true,  crossSources: ["baidu_realtime","douyin_travel"], keywords: ["云南","目瑙纵歌","景颇族"] },

  // 快手实时
  { id: "r40", title: "非遗穿进日常的N种方式",          summary: "快手非遗话题持续发酵,UGC内容暴增",               category: "文化展览",   source: "kuaishou_realtime", rank: 1,  prevRank: 1,  trend: "flat", heat: 1211600, heatTrend: 42,  duration: "2d",  firstSeen: "2026-04-13 14:00", travelRelated: true,  crossSources: ["kuaishou_realtime","douyin_realtime"], keywords: ["非遗","传统","日常"] },
  { id: "r41", title: "江苏为什么能把苏超玩出新花样",   summary: "苏超联赛玩法创新,引发广泛讨论",                   category: "社会民生",   source: "kuaishou_realtime", rank: 2,  prevRank: 4,  trend: "up",   heat: 1210000, heatTrend: 88,  duration: "1d",  firstSeen: "2026-04-14 18:00", travelRelated: false, crossSources: ["kuaishou_realtime"], keywords: ["江苏","苏超","联赛"] },

  // ─── 旅游榜 ───────────────────────────────────────
  { id: "r6",  title: "杭州西湖夜游攻略",             summary: "夜游路线视频带火新玩法,UGC 内容激增",            category: "旅游目的地", source: "douyin_travel",     rank: 1,  prevRank: 1,  trend: "flat", heat: 680000,  heatTrend: 22,  duration: "2d",  firstSeen: "2026-04-13 19:00", travelRelated: true,  crossSources: ["douyin_travel","xhs_travel"], keywords: ["杭州","西湖","夜游"] },
  { id: "r7",  title: "云南雨崩村徒步",               summary: "春季徒步季开启,雨崩村相关视频播放暴增",          category: "户外活动",   source: "douyin_travel",     rank: 2,  prevRank: 6,  trend: "up",   heat: 540000,  heatTrend: 134, duration: "1d",  firstSeen: "2026-04-14 15:00", travelRelated: true,  crossSources: ["douyin_travel","xhs_travel"], keywords: ["云南","雨崩","徒步"] },
  { id: "r8",  title: "成都熊猫基地预约爆满",         summary: "五一前夕熊猫基地门票紧俏,多日售罄",              category: "旅游目的地", source: "douyin_travel",     rank: 3,  prevRank: 4,  trend: "up",   heat: 480000,  heatTrend: 67,  duration: "3d",  firstSeen: "2026-04-12 10:00", travelRelated: true,  crossSources: ["douyin_travel","weibo_travel","xhs_travel"], keywords: ["成都","熊猫","门票"] },

  { id: "r15", title: "#洛阳牡丹文化节#",              summary: "牡丹盛花期到来,洛阳话题持续在榜首",              category: "旅游目的地", source: "weibo_travel",      rank: 1,  prevRank: 1,  trend: "flat", heat: 524000,  heatTrend: 18,  duration: "5d",  firstSeen: "2026-04-10 10:00", travelRelated: true,  crossSources: ["weibo_travel","xhs_travel"], keywords: ["洛阳","牡丹","文化节"] },
  { id: "r16", title: "#上海咖啡文化周#",              summary: "城市生活方式活动,小红书种草型话题",              category: "美食",      source: "weibo_travel",      rank: 2,  prevRank: 5,  trend: "up",   heat: 289000,  heatTrend: 45,  duration: "3d",  firstSeen: "2026-04-12 11:00", travelRelated: true,  crossSources: ["weibo_travel","xhs_travel"], keywords: ["上海","咖啡","新天地"] },
  { id: "r17", title: "#五一宝藏小城#",                summary: "中小城市目的地推荐合集,避开热门人潮",            category: "旅游目的地", source: "weibo_travel",      rank: 3,  prevRank: 2,  trend: "down", heat: 258000,  heatTrend: -8,  duration: "4d",  firstSeen: "2026-04-11 14:00", travelRelated: true,  crossSources: ["weibo_travel","xhs_travel"], keywords: ["五一","小城","宝藏"] },

  { id: "r19", title: "云南异龙湖畔粉色花海上线",      summary: "彩色花海打卡视频带火该湖景点",                    category: "旅游目的地", source: "xhs_travel",        rank: 1,  prevRank: 1,  trend: "flat", heat: 108000,  heatTrend: 28,  duration: "3d",  firstSeen: "2026-04-12 15:00", travelRelated: true,  crossSources: ["xhs_travel","douyin_travel"], keywords: ["云南","异龙湖","花海"] },
  { id: "r20", title: "用杜鹃花打开河南的春天",        summary: "河南春季杜鹃花海笔记暴涨,多个景点出圈",          category: "旅游目的地", source: "xhs_travel",        rank: 2,  prevRank: 3,  trend: "up",   heat: 100000,  heatTrend: 54,  duration: "5d",  firstSeen: "2026-04-10 11:30", travelRelated: true,  crossSources: ["xhs_travel","weibo_travel"], keywords: ["河南","杜鹃花","春天"] },
  { id: "r21", title: "云南千亩腋花杜鹃上演春日浪漫",  summary: "高山杜鹃花季,小红书种草笔记激增",                category: "旅游目的地", source: "xhs_travel",        rank: 3,  trend: "new",  heat: 95000,   heatTrend: 0,   duration: "8h",  firstSeen: "2026-04-15 12:00", travelRelated: true,  crossSources: ["xhs_travel"], keywords: ["云南","杜鹃","花季"] },

  // ─── 同城榜（带城市维度） ──────────────────────
  { id: "c1",  title: "北影节闭幕式第一波官宣",        summary: "北京国际电影节闭幕式阵容曝光",                    category: "演出活动",   source: "weibo_city",        rank: 1,  prevRank: 2,  trend: "up",   heat: 65710,   heatTrend: 38,  duration: "1d",  firstSeen: "2026-04-14 20:00", travelRelated: true,  crossSources: ["weibo_city","weibo_realtime"], keywords: ["北影节","闭幕式","北京"], city: "北京",
    relatedPosts: [post("北影节闭幕式第一波官宣", "@北京国际电影节")] },
  { id: "c2",  title: "小伙还原圆明园兽首",            summary: "工艺师复刻圆明园兽首,引发文化讨论",              category: "文化展览",   source: "weibo_city",        rank: 2,  prevRank: 1,  trend: "down", heat: 61010,   heatTrend: -10, duration: "2d",  firstSeen: "2026-04-13 16:00", travelRelated: true,  crossSources: ["weibo_city"], keywords: ["圆明园","兽首","非遗"], city: "北京",
    relatedPosts: [post("小伙还原圆明园兽首", "@共青团中央")] },
  { id: "c3",  title: "北京国际电影节",                 summary: "电影节话题热度持续走高",                            category: "演出活动",   source: "weibo_city",        rank: 3,  prevRank: 4,  trend: "up",   heat: 59630,   heatTrend: 22,  duration: "5d",  firstSeen: "2026-04-10 09:00", travelRelated: true,  crossSources: ["weibo_city","weibo_realtime"], keywords: ["北京","电影节"], city: "北京",
    relatedPosts: [post("北京国际电影节", "")] },
  { id: "c4",  title: "五月天北京演唱会二开疑似跳票",   summary: "五月天演唱会传出延期消息,粉丝热议",              category: "演出活动",   source: "weibo_city",        rank: 5,  trend: "new",  heat: 59380,   heatTrend: 0,   duration: "2h",  firstSeen: "2026-04-15 20:30", travelRelated: true,  crossSources: ["weibo_city"], keywords: ["五月天","北京","演唱会"], city: "北京",
    relatedPosts: [post("五月天北京演唱会二开疑似跳票", "@经济参考报")] },
  { id: "c5",  title: "上海咖啡市集开市",              summary: "新天地周末咖啡市集开市,人气爆棚",                category: "美食",      source: "weibo_city",        rank: 1,  prevRank: 1,  trend: "flat", heat: 48200,   heatTrend: 15,  duration: "2d",  firstSeen: "2026-04-13 10:00", travelRelated: true,  crossSources: ["weibo_city","xhs_travel"], keywords: ["上海","咖啡","市集"], city: "上海",
    relatedPosts: [post("上海咖啡市集开市", "@上海发布")] },
  { id: "c6",  title: "成都漫展周末开幕",              summary: "动漫节日吸引数万年轻人到场",                      category: "演出活动",   source: "douyin_city",       rank: 1,  prevRank: 3,  trend: "up",   heat: 89200,   heatTrend: 58,  duration: "1d",  firstSeen: "2026-04-14 18:00", travelRelated: true,  crossSources: ["douyin_city","douyin_realtime"], keywords: ["成都","漫展","二次元"], city: "成都",
    relatedPosts: [post("成都漫展周末开幕", "@成都发布")] },

  // ─── 景点榜 ───────────────────────────────────────
  { id: "p1",  title: "灵隐寺",                         summary: "刷到灵隐寺,不要无视 真的特别灵~",                category: "旅游目的地", source: "attraction_board",  rank: 1,  prevRank: 2,  trend: "up",   heat: 167900,  heatTrend: 22,  duration: "10d", firstSeen: "2026-04-05 12:00", travelRelated: true,  crossSources: ["attraction_board","xhs_travel"], keywords: ["灵隐寺","杭州","寺庙"],
    poiName: "灵隐寺", poiRegion: "全国",
    relatedPosts: [post("刷到灵隐寺,不要无视 真的特别灵~", "Support_周杰伦")] },
  { id: "p2",  title: "上海迪士尼度假区",                summary: "“加你更奇妙”盛会启幕,10岁生日庆典",              category: "旅游目的地", source: "attraction_board",  rank: 2,  prevRank: 1,  trend: "down", heat: 77900,   heatTrend: -8,  duration: "30d", firstSeen: "2026-03-15 10:00", travelRelated: true,  crossSources: ["attraction_board","weibo_travel","xhs_travel"], keywords: ["迪士尼","上海","乐园"],
    poiName: "上海迪士尼度假区", poiRegion: "全国",
    relatedPosts: [post("“加你更奇妙”盛会启幕", "上海迪士尼度假区")] },
  { id: "p3",  title: "鸟巢",                            summary: "“万人雨刷器”张杰演唱会现场震撼",                  category: "演出活动",   source: "attraction_board",  rank: 3,  prevRank: 5,  trend: "up",   heat: 77600,   heatTrend: 64,  duration: "3d",  firstSeen: "2026-04-12 20:00", travelRelated: true,  crossSources: ["attraction_board","weibo_realtime"], keywords: ["鸟巢","张杰","演唱会"],
    poiName: "鸟巢", poiRegion: "北京",
    relatedPosts: [post("万人雨刷器 张杰演唱会现场", "张杰")] },
  { id: "p4",  title: "北京环球度假区",                  summary: "“无限春日狂欢派对”特别活动开嗨",                  category: "旅游目的地", source: "attraction_board",  rank: 4,  prevRank: 4,  trend: "flat", heat: 73300,   heatTrend: 5,   duration: "12d", firstSeen: "2026-04-03 09:00", travelRelated: true,  crossSources: ["attraction_board"], keywords: ["环球","北京","度假"],
    poiName: "北京环球度假区", poiRegion: "全国",
    relatedPosts: [post("无限春日狂欢对快乐场 特别活动", "北京环球度假区")] },
  { id: "p5",  title: "故宫",                            summary: "#故宫春日壁纸50张# 四时流转,生生不息",            category: "文化展览",   source: "attraction_board",  rank: 5,  prevRank: 6,  trend: "up",   heat: 40800,   heatTrend: 18,  duration: "20d", firstSeen: "2026-03-25 11:00", travelRelated: true,  crossSources: ["attraction_board","weibo_travel"], keywords: ["故宫","春日","壁纸"],
    poiName: "故宫", poiRegion: "北京",
    relatedPosts: [post("#故宫春日壁纸50张# 四时流转", "人民日报")] },
  { id: "p6",  title: "五台山",                          summary: "山西旅游有段位的话,最后几个你可能没去过",          category: "旅游目的地", source: "attraction_board",  rank: 6,  trend: "new",  heat: 40700,   heatTrend: 0,   duration: "1d",  firstSeen: "2026-04-14 16:00", travelRelated: true,  crossSources: ["attraction_board"], keywords: ["五台山","山西","佛教"],
    poiName: "五台山", poiRegion: "山西",
    relatedPosts: [post("山西旅游有段位的话", "环球记录频道")] },

  // ─── 酒店榜 ───────────────────────────────────────
  { id: "h1",  title: "澳门伦敦人度假区",                summary: "旅行的记忆,此刻唤醒2023寻味旅行直播",            category: "酒店住宿",   source: "hotel_board",       rank: 1,  prevRank: 1,  trend: "flat", heat: 11200,   heatTrend: 14,  duration: "15d", firstSeen: "2026-03-31 10:00", travelRelated: true,  crossSources: ["hotel_board"], keywords: ["澳门","伦敦人","度假"],
    poiName: "澳门伦敦人度假区", poiRegion: "全国",
    relatedPosts: [post("旅行的记忆,寻味旅行全新直播", "寻味旅行")] },
  { id: "h2",  title: "三亚艾迪逊酒店",                  summary: "三亚艾迪逊酒店服务员态度也很好的话题",            category: "酒店住宿",   source: "hotel_board",       rank: 2,  prevRank: 4,  trend: "up",   heat: 3970,    heatTrend: 38,  duration: "5d",  firstSeen: "2026-04-10 12:00", travelRelated: true,  crossSources: ["hotel_board","xhs_travel"], keywords: ["三亚","艾迪逊","海滨"],
    poiName: "三亚艾迪逊酒店", poiRegion: "海南",
    relatedPosts: [post("#三亚艾迪逊酒店# 服务超赞", "meghen玫瑰")] },
  { id: "h3",  title: "澳门威尼斯人",                    summary: "“澳门威尼斯人 澳门风云” 用户晒图",                category: "酒店住宿",   source: "hotel_board",       rank: 3,  prevRank: 2,  trend: "down", heat: 2820,    heatTrend: -10, duration: "20d", firstSeen: "2026-03-25 14:00", travelRelated: true,  crossSources: ["hotel_board"], keywords: ["澳门","威尼斯人","赌场"],
    poiName: "澳门威尼斯人", poiRegion: "全国",
    relatedPosts: [post("还好我穷接触不到", "一颗甜马")] },
  { id: "h4",  title: "大同酒店",                        summary: "大同酒店来了这家酒店超级美 惊喜",                  category: "酒店住宿",   source: "hotel_board",       rank: 4,  prevRank: 5,  trend: "up",   heat: 2680,    heatTrend: 22,  duration: "7d",  firstSeen: "2026-04-08 18:00", travelRelated: true,  crossSources: ["hotel_board"], keywords: ["大同","酒店","山西"],
    poiName: "大同酒店", poiRegion: "山西",
    relatedPosts: [post("大同既下山为了这家酒店来大同", "琳波子")] },
  { id: "h5",  title: "上海宝格丽酒店",                  summary: "上海宝格丽酒店跨年夜房费高达30余万",              category: "酒店住宿",   source: "hotel_board",       rank: 5,  prevRank: 3,  trend: "down", heat: 2330,    heatTrend: -25, duration: "30d", firstSeen: "2026-03-15 09:00", travelRelated: true,  crossSources: ["hotel_board"], keywords: ["上海","宝格丽","奢华"],
    poiName: "上海宝格丽酒店", poiRegion: "全国",
    relatedPosts: [post("#上海宝格丽酒店跨年夜房费高达30余万#", "海报新闻")] },
  { id: "h6",  title: "香港瑰丽酒店",                    summary: "大姐学校很多学生身家丰厚,在香港住瑰丽",            category: "酒店住宿",   source: "hotel_board",       rank: 6,  trend: "new",  heat: 2030,    heatTrend: 0,   duration: "12h", firstSeen: "2026-04-15 08:00", travelRelated: true,  crossSources: ["hotel_board"], keywords: ["香港","瑰丽","奢华"],
    poiName: "香港瑰丽酒店", poiRegion: "全国",
    relatedPosts: [post("帮客人拉行李搬行李", "美美小兔子")] },
];

export const formatHeat = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(1)}w` : `${n}`;

// City list for 同城榜 filter
export const CITIES = ["北京", "上海", "广州", "深圳", "成都", "杭州", "武汉", "西安"];
// Regions for 景点/酒店 filter
export const REGIONS = ["全国", "北京", "上海", "广东", "四川", "云南", "山西", "海南", "浙江"];

// ─── Time-series helpers (deterministic mock based on topic id) ───
const hashCode = (s: string) => s.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
const seedRand = (seed: number) => {
  let x = Math.abs(seed) || 1;
  return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
};

export interface RankPoint { time: string; rank: number | null; }
export interface HeatPoint { time: string; heat: number; }

export function buildRankHistory(topic: RankTopic, source: RankSource): RankPoint[] {
  const rng = seedRand(hashCode(topic.id + source));
  const inThisBoard = topic.crossSources.includes(source) || topic.source === source;
  const baseRank = topic.source === source ? topic.rank : (10 + Math.floor(rng() * 30));
  const points: RankPoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const t = `${String((22 - i + 24) % 24).padStart(2, "0")}:00`;
    if (!inThisBoard) { points.push({ time: t, rank: null }); continue; }
    const distance = i / 23;
    const noise = (rng() - 0.5) * 8;
    let r = Math.round(baseRank + distance * 6 + noise);
    if (r < 1) r = 1;
    if (r > 50) r = 50;
    if (topic.trend === "new" && i > 3) { points.push({ time: t, rank: null }); continue; }
    points.push({ time: t, rank: r });
  }
  return points;
}

export function buildHeatHistory(topic: RankTopic): HeatPoint[] {
  const rng = seedRand(hashCode(topic.id + "heat"));
  const peak = topic.heat;
  const points: HeatPoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const t = `${String((22 - i + 24) % 24).padStart(2, "0")}:00`;
    let factor: number;
    if (topic.trend === "boom" || topic.trend === "up") {
      factor = 0.15 + (1 - i / 23) * 0.85 + (rng() - 0.5) * 0.1;
    } else if (topic.trend === "down") {
      factor = 0.4 + (i / 23) * 0.6 + (rng() - 0.5) * 0.1;
    } else if (topic.trend === "new") {
      factor = i > 3 ? 0 : 0.4 + (3 - i) * 0.2;
    } else {
      factor = 0.7 + (rng() - 0.5) * 0.2;
    }
    points.push({ time: t, heat: Math.max(0, Math.round(peak * factor)) });
  }
  return points;
}

export const findTopic = (id: string) => rankTopics.find(t => t.id === id);

export function refreshSnapshot(timestamp: number): { topics: RankTopic[]; updatedIds: string[] } {
  const rng = seedRand(timestamp);
  const updatedIds: string[] = [];
  const topics = rankTopics.map(t => {
    const shift = Math.floor((rng() - 0.5) * 4);
    const heatShift = Math.floor((rng() - 0.5) * t.heat * 0.15);
    const newRank = Math.max(1, Math.min(50, t.rank + shift));
    const newHeat = Math.max(1000, t.heat + heatShift);
    let newTrend: TrendDir = t.trend;
    if (rng() > 0.85 && newHeat - t.heat > t.heat * 0.05) { newTrend = "boom"; updatedIds.push(t.id); }
    else if (rng() > 0.9) { newTrend = "new"; updatedIds.push(t.id); }
    else if (shift !== 0 || heatShift !== 0) updatedIds.push(t.id);
    return { ...t, rank: newRank, prevRank: t.rank, heat: newHeat, trend: newTrend };
  });
  return { topics, updatedIds };
}
