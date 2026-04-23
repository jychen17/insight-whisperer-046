// Mock data for the Social Media Rankings (社媒榜单) theme.
// Sources: Douyin realtime/travel, Weibo realtime/travel, Xiaohongshu travel.

export type RankSource =
  | "douyin_realtime"
  | "douyin_travel"
  | "weibo_realtime"
  | "weibo_travel"
  | "xhs_travel";

export interface RankSourceMeta {
  key: RankSource;
  platform: "抖音" | "微博" | "小红书";
  board: string;
  shortLabel: string;
  cls: string; // tailwind classes for color chip
  dot: string; // dot color
}

export const RANK_SOURCES: Record<RankSource, RankSourceMeta> = {
  douyin_realtime: { key: "douyin_realtime", platform: "抖音", board: "实时榜",   shortLabel: "抖音·实时",   cls: "bg-slate-900 text-white",            dot: "bg-slate-900" },
  douyin_travel:   { key: "douyin_travel",   platform: "抖音", board: "旅游榜单", shortLabel: "抖音·旅游",   cls: "bg-slate-100 text-slate-800 border border-slate-300", dot: "bg-slate-700" },
  weibo_realtime:  { key: "weibo_realtime",  platform: "微博", board: "实时榜",   shortLabel: "微博·实时",   cls: "bg-rose-100 text-rose-700 border border-rose-200",    dot: "bg-rose-500" },
  weibo_travel:    { key: "weibo_travel",    platform: "微博", board: "旅游榜单", shortLabel: "微博·旅游",   cls: "bg-amber-100 text-amber-700 border border-amber-200", dot: "bg-amber-500" },
  xhs_travel:      { key: "xhs_travel",      platform: "小红书", board: "旅游榜单", shortLabel: "小红书·旅游", cls: "bg-pink-100 text-pink-700 border border-pink-200",    dot: "bg-pink-500" },
};

export type TrendDir = "up" | "down" | "flat" | "new" | "boom";
export type TopicCategory = "明星娱乐" | "旅游目的地" | "节假出行" | "社会民生" | "美食" | "酒店住宿" | "交通出行" | "户外活动";

export interface RankTopic {
  id: string;
  title: string;          // 话题标题
  summary: string;        // 简短摘要 / 上下文
  category: TopicCategory;
  source: RankSource;     // 主要来源
  rank: number;           // 当前排名
  prevRank?: number;      // 上次排名
  trend: TrendDir;        // 趋势
  heat: number;           // 热度值
  heatTrend: number;      // 热度涨幅 %
  duration: string;       // 在榜时长
  firstSeen: string;      // 首次上榜
  travelRelated: boolean; // 与旅游业务相关
  crossSources: RankSource[]; // 跨榜分布
  keywords: string[];     // 关联词
}

export const rankTopics: RankTopic[] = [
  // 抖音 实时榜
  { id: "r1",  title: "周杰伦上海演唱会现场",                summary: "嘉年华世界巡演上海三场连开,粉丝实拍片段刷屏", category: "明星娱乐",   source: "douyin_realtime", rank: 1,  prevRank: 3,  trend: "up",   heat: 1287000, heatTrend: 245, duration: "8h",  firstSeen: "2026-04-15 14:20", travelRelated: true,  crossSources: ["douyin_realtime","weibo_realtime"], keywords: ["周杰伦","上海","演唱会"] },
  { id: "r2",  title: "五一假期出行高峰预警",                  summary: "全国铁路客流预计创历史新高,多地发布出行提示",   category: "节假出行",   source: "douyin_realtime", rank: 2,  prevRank: 5,  trend: "up",   heat: 980000,  heatTrend: 178, duration: "12h", firstSeen: "2026-04-15 09:00", travelRelated: true,  crossSources: ["douyin_realtime","weibo_realtime","weibo_travel"], keywords: ["五一","出行","高铁"] },
  { id: "r3",  title: "淄博烧烤回归热度",                     summary: "进入春季淄博烧烤话题再次走高,商家备货",         category: "美食",      source: "douyin_realtime", rank: 5,  prevRank: 2,  trend: "down", heat: 760000,  heatTrend: -32, duration: "3d",  firstSeen: "2026-04-12 18:00", travelRelated: true,  crossSources: ["douyin_realtime","xhs_travel"], keywords: ["淄博","烧烤","美食"] },
  { id: "r4",  title: "日本樱花季签证排队",                   summary: "多领事馆出现签证排队,网友吐槽预约难",           category: "交通出行",   source: "douyin_realtime", rank: 8,  trend: "new",  heat: 540000,  heatTrend: 0,   duration: "1h",  firstSeen: "2026-04-15 21:00", travelRelated: true,  crossSources: ["douyin_realtime"],            keywords: ["日本","樱花","签证"] },
  { id: "r5",  title: "上海地铁限流话题",                     summary: "工作日早高峰多个站点限流,通勤吐槽刷屏",         category: "社会民生",   source: "douyin_realtime", rank: 11, prevRank: 9,  trend: "down", heat: 420000,  heatTrend: -15, duration: "1d",  firstSeen: "2026-04-14 08:30", travelRelated: false, crossSources: ["douyin_realtime","weibo_realtime"], keywords: ["上海","地铁","限流"] },

  // 抖音 旅游榜单
  { id: "r6",  title: "杭州西湖夜游攻略",                     summary: "夜游路线视频带火新玩法,UGC 内容激增",           category: "旅游目的地", source: "douyin_travel",   rank: 1,  prevRank: 1,  trend: "flat", heat: 680000,  heatTrend: 22,  duration: "2d",  firstSeen: "2026-04-13 19:00", travelRelated: true,  crossSources: ["douyin_travel","xhs_travel"],   keywords: ["杭州","西湖","夜游"] },
  { id: "r7",  title: "云南雨崩村徒步",                       summary: "春季徒步季开启,雨崩村相关视频播放暴增",         category: "户外活动",   source: "douyin_travel",   rank: 2,  prevRank: 6,  trend: "up",   heat: 540000,  heatTrend: 134, duration: "1d",  firstSeen: "2026-04-14 15:00", travelRelated: true,  crossSources: ["douyin_travel","xhs_travel"],   keywords: ["云南","雨崩","徒步"] },
  { id: "r8",  title: "成都熊猫基地预约爆满",                 summary: "五一前夕熊猫基地门票紧俏,多日售罄",             category: "旅游目的地", source: "douyin_travel",   rank: 3,  prevRank: 4,  trend: "up",   heat: 480000,  heatTrend: 67,  duration: "3d",  firstSeen: "2026-04-12 10:00", travelRelated: true,  crossSources: ["douyin_travel","weibo_travel","xhs_travel"], keywords: ["成都","熊猫","门票"] },
  { id: "r9",  title: "新疆独库公路开通倒计时",               summary: "网友期盼独库公路解封,自驾路书提前刷屏",         category: "户外活动",   source: "douyin_travel",   rank: 4,  trend: "new",  heat: 410000,  heatTrend: 0,   duration: "5h",  firstSeen: "2026-04-15 17:30", travelRelated: true,  crossSources: ["douyin_travel"],                keywords: ["新疆","独库","自驾"] },

  // 微博 实时榜
  { id: "r10", title: "#五一返程机票退改#",                    summary: "用户大量反映退改难、客服占线,投诉量激增",       category: "交通出行",   source: "weibo_realtime",  rank: 1,  prevRank: 4,  trend: "boom", heat: 894000,  heatTrend: 412, duration: "6h",  firstSeen: "2026-04-15 16:00", travelRelated: true,  crossSources: ["weibo_realtime","douyin_realtime"], keywords: ["五一","机票","退改"] },
  { id: "r11", title: "#薛之谦北京演唱会#",                    summary: "鸟巢双场开票即售罄,黄牛话题登上热搜",           category: "明星娱乐",   source: "weibo_realtime",  rank: 3,  prevRank: 7,  trend: "up",   heat: 768000,  heatTrend: 178, duration: "1d",  firstSeen: "2026-04-14 20:00", travelRelated: true,  crossSources: ["weibo_realtime","douyin_realtime"], keywords: ["薛之谦","北京","鸟巢"] },
  { id: "r12", title: "#草莓音乐节成都站#",                    summary: "三日通票售罄,周边酒店搜索量飙升",               category: "明星娱乐",   source: "weibo_realtime",  rank: 6,  prevRank: 8,  trend: "up",   heat: 675000,  heatTrend: 132, duration: "2d",  firstSeen: "2026-04-13 12:00", travelRelated: true,  crossSources: ["weibo_realtime","douyin_realtime","xhs_travel"], keywords: ["成都","草莓音乐节","五一"] },
  { id: "r13", title: "#高铁霸座新规#",                        summary: "新规实施引发广泛讨论,多个案例登上热搜",         category: "社会民生",   source: "weibo_realtime",  rank: 9,  trend: "new",  heat: 432000,  heatTrend: 0,   duration: "2h",  firstSeen: "2026-04-15 19:30", travelRelated: false, crossSources: ["weibo_realtime"],               keywords: ["高铁","霸座","新规"] },
  { id: "r14", title: "#特种兵旅游卷土重来#",                  summary: "毕业生群体兴起新一轮特种兵旅游话题",            category: "旅游目的地", source: "weibo_realtime",  rank: 14, prevRank: 11, trend: "down", heat: 318000,  heatTrend: -22, duration: "2d",  firstSeen: "2026-04-13 21:00", travelRelated: true,  crossSources: ["weibo_realtime","xhs_travel"],  keywords: ["特种兵","旅游","学生"] },

  // 微博 旅游榜单
  { id: "r15", title: "#洛阳牡丹文化节#",                      summary: "牡丹盛花期到来,洛阳话题持续在榜首",             category: "旅游目的地", source: "weibo_travel",    rank: 1,  prevRank: 1,  trend: "flat", heat: 524000,  heatTrend: 18,  duration: "5d",  firstSeen: "2026-04-10 10:00", travelRelated: true,  crossSources: ["weibo_travel","xhs_travel"],    keywords: ["洛阳","牡丹","文化节"] },
  { id: "r16", title: "#上海咖啡文化周#",                      summary: "城市生活方式活动,小红书种草型话题",             category: "美食",      source: "weibo_travel",    rank: 2,  prevRank: 5,  trend: "up",   heat: 289000,  heatTrend: 45,  duration: "3d",  firstSeen: "2026-04-12 11:00", travelRelated: true,  crossSources: ["weibo_travel","xhs_travel"],    keywords: ["上海","咖啡","新天地"] },
  { id: "r17", title: "#五一宝藏小城#",                        summary: "中小城市目的地推荐合集,避开热门人潮",           category: "旅游目的地", source: "weibo_travel",    rank: 3,  prevRank: 2,  trend: "down", heat: 258000,  heatTrend: -8,  duration: "4d",  firstSeen: "2026-04-11 14:00", travelRelated: true,  crossSources: ["weibo_travel","xhs_travel"],    keywords: ["五一","小城","宝藏"] },
  { id: "r18", title: "#青甘大环线攻略#",                      summary: "暑期前预热,自驾路线攻略集中发布",               category: "户外活动",   source: "weibo_travel",    rank: 5,  trend: "new",  heat: 184000,  heatTrend: 0,   duration: "1d",  firstSeen: "2026-04-14 09:00", travelRelated: true,  crossSources: ["weibo_travel","xhs_travel"],    keywords: ["青甘","大环线","自驾"] },

  // 小红书 旅游榜单
  { id: "r19", title: "teamLab 上海特展打卡",                  summary: "无界美术馆持续高热,亲子+情侣双客群",            category: "旅游目的地", source: "xhs_travel",      rank: 1,  prevRank: 1,  trend: "flat", heat: 452000,  heatTrend: 68,  duration: "7d",  firstSeen: "2026-04-08 15:00", travelRelated: true,  crossSources: ["xhs_travel","weibo_travel"],    keywords: ["上海","teamLab","展览"] },
  { id: "r20", title: "Citywalk 武康路一日",                   summary: "本地宝典型种草路线,周末爆满",                   category: "旅游目的地", source: "xhs_travel",      rank: 2,  prevRank: 3,  trend: "up",   heat: 386000,  heatTrend: 54,  duration: "5d",  firstSeen: "2026-04-10 11:30", travelRelated: true,  crossSources: ["xhs_travel"],                   keywords: ["上海","Citywalk","武康路"] },
  { id: "r21", title: "云南民宿避世清单",                       summary: "大理洱海/腾冲/沙溪小众民宿合集",                 category: "酒店住宿",   source: "xhs_travel",      rank: 4,  prevRank: 6,  trend: "up",   heat: 298000,  heatTrend: 41,  duration: "4d",  firstSeen: "2026-04-11 16:00", travelRelated: true,  crossSources: ["xhs_travel","douyin_travel"],   keywords: ["云南","民宿","大理"] },
  { id: "r22", title: "迪士尼乐园周边攻略",                     summary: "上海/香港迪士尼春季玩法笔记暴涨",               category: "旅游目的地", source: "xhs_travel",      rank: 5,  prevRank: 4,  trend: "down", heat: 254000,  heatTrend: -12, duration: "6d",  firstSeen: "2026-04-09 18:00", travelRelated: true,  crossSources: ["xhs_travel","douyin_travel"],   keywords: ["迪士尼","上海","香港"] },
  { id: "r23", title: "海岛蜜月酒店清单",                       summary: "马尔代夫/巴厘岛春夏蜜月酒店笔记上升",            category: "酒店住宿",   source: "xhs_travel",      rank: 8,  trend: "new",  heat: 178000,  heatTrend: 0,   duration: "8h",  firstSeen: "2026-04-15 12:00", travelRelated: true,  crossSources: ["xhs_travel"],                   keywords: ["马尔代夫","蜜月","酒店"] },
];

export const formatHeat = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(1)}w` : `${n}`;

// ─── Time-series helpers (deterministic mock based on topic id) ───
const hashCode = (s: string) => s.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
const seedRand = (seed: number) => {
  let x = Math.abs(seed) || 1;
  return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
};

export interface RankPoint { time: string; rank: number | null; }
export interface HeatPoint { time: string; heat: number; }

// 24 小时排名变化（每个榜单源一条折线）
export function buildRankHistory(topic: RankTopic, source: RankSource): RankPoint[] {
  const rng = seedRand(hashCode(topic.id + source));
  const inThisBoard = topic.crossSources.includes(source) || topic.source === source;
  const baseRank = topic.source === source ? topic.rank : (10 + Math.floor(rng() * 30));
  const points: RankPoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const t = `${String((22 - i + 24) % 24).padStart(2, "0")}:00`;
    if (!inThisBoard) { points.push({ time: t, rank: null }); continue; }
    // 距离当前越近越接近 baseRank;远的时候有更大波动,首次上榜前为 null
    const distance = i / 23;
    const noise = (rng() - 0.5) * 8;
    let r = Math.round(baseRank + distance * 6 + noise);
    if (r < 1) r = 1;
    if (r > 50) r = 50;
    // 模拟"新上榜":只有最近 1-3 个点有数据
    if (topic.trend === "new" && i > 3) { points.push({ time: t, rank: null }); continue; }
    points.push({ time: t, rank: r });
  }
  return points;
}

// 24 小时热度曲线
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

// 用于"刷新":返回扰动后的新数据快照(同一时刻调用结果一致,通过 timestamp 改变)
export function refreshSnapshot(timestamp: number): { topics: RankTopic[]; updatedIds: string[] } {
  const rng = seedRand(timestamp);
  const updatedIds: string[] = [];
  const topics = rankTopics.map(t => {
    const shift = Math.floor((rng() - 0.5) * 4); // -2 ~ +2
    const heatShift = Math.floor((rng() - 0.5) * t.heat * 0.15);
    const newRank = Math.max(1, Math.min(50, t.rank + shift));
    const newHeat = Math.max(1000, t.heat + heatShift);
    let newTrend: TrendDir = t.trend;
    // 偶尔触发新爆点
    if (rng() > 0.85 && newHeat - t.heat > t.heat * 0.05) { newTrend = "boom"; updatedIds.push(t.id); }
    else if (rng() > 0.9) { newTrend = "new"; updatedIds.push(t.id); }
    else if (shift !== 0 || heatShift !== 0) updatedIds.push(t.id);
    return { ...t, rank: newRank, prevRank: t.rank, heat: newHeat, trend: newTrend };
  });
  return { topics, updatedIds };
}

