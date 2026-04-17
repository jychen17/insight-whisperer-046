import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ListFilter, Eye, Edit2, ExternalLink, Clock, Tag, Database, Hash } from "lucide-react";

interface DataSourceRow {
  taskId: string;
  taskName: string;
  themeId: string;
  themeName: string;
  taskType: "话题" | "账号" | "关键词";
  platforms: string[];
  schedule: string;
  enabled: boolean;
  /** 抓取目标内容（关键词/话题/账号/链接） */
  targets: string[];
}

// Mock 数据：所有主题里第二步配置的数据源汇总
const mockSources: DataSourceRow[] = [
  { taskId: "ds_t001", taskName: "同程品牌全网监控", themeId: "brand_safety", themeName: "品牌安全监测", taskType: "关键词", platforms: ["新浪微博", "小红书", "抖音"], schedule: "每 6 小时", enabled: true,
    targets: ["同程旅行", "同程艺龙", "Tongcheng"] },
  { taskId: "ds_t002", taskName: "竞品话题追踪", themeId: "brand_safety", themeName: "品牌安全监测", taskType: "话题", platforms: ["新浪微博", "知乎"], schedule: "每 2 小时", enabled: true,
    targets: ["#携程酒店#", "#飞猪机票#", "#去哪儿网#"] },
  { taskId: "ds_t003", taskName: "酒店投诉账号监控", themeId: "hotel_quality", themeName: "酒店服务质量", taskType: "账号", platforms: ["黑猫投诉", "消费保"], schedule: "每 4 小时", enabled: true,
    targets: ["@黑猫投诉官方", "@消费保官方"] },
  { taskId: "ds_t004", taskName: "机票退改关键词", themeId: "flight_refund", themeName: "机票退改舆情", taskType: "关键词", platforms: ["新浪微博", "今日头条", "百度"], schedule: "每 1 小时", enabled: false,
    targets: ["机票退票", "改签难", "退款慢"] },
  { taskId: "ds_t005", taskName: "度假产品口碑账号", themeId: "vacation_review", themeName: "度假产品口碑", taskType: "账号", platforms: ["小红书", "B站"], schedule: "每 12 小时", enabled: true,
    targets: ["@小红书旅行", "@B站旅游官方"] },
  { taskId: "ds_t006", taskName: "高铁出行话题", themeId: "train_topic", themeName: "高铁出行洞察", taskType: "话题", platforms: ["新浪微博"], schedule: "每 6 小时", enabled: true,
    targets: ["#高铁出行#", "#五一返程#"] },
  { taskId: "ds_t007", taskName: "民宿差评关键词", themeId: "hotel_quality", themeName: "酒店服务质量", taskType: "关键词", platforms: ["小红书", "抖音", "快手"], schedule: "每 3 小时", enabled: true,
    targets: ["民宿踩坑", "民宿差评", "民宿避雷"] },
];

const TASK_TYPES = ["关键词", "话题", "账号"];
const ALL_THEMES = Array.from(new Set(mockSources.map((s) => s.themeName)));

export default function CollectionTasks() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [themeFilter, setThemeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState(mockSources);
  const [detailRow, setDetailRow] = useState<DataSourceRow | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search && !r.taskName.includes(search) && !r.themeName.includes(search) && !r.taskId.includes(search)) return false;
      if (themeFilter !== "all" && r.themeName !== themeFilter) return false;
      if (typeFilter !== "all" && r.taskType !== typeFilter) return false;
      if (statusFilter === "enabled" && !r.enabled) return false;
      if (statusFilter === "disabled" && r.enabled) return false;
      return true;
    });
  }, [rows, search, themeFilter, typeFilter, statusFilter]);

  const stats = useMemo(() => ([
    { label: "采集任务总数", value: rows.length, color: "text-foreground" },
    { label: "运行中", value: rows.filter((r) => r.enabled).length, color: "text-emerald-500" },
    { label: "覆盖主题", value: new Set(rows.map((r) => r.themeId)).size, color: "text-primary" },
    { label: "覆盖平台", value: new Set(rows.flatMap((r) => r.platforms)).size, color: "text-foreground" },
  ]), [rows]);

  const toggleStatus = (taskId: string) => {
    setRows((prev) => prev.map((r) => (r.taskId === taskId ? { ...r, enabled: !r.enabled } : r)));
  };

  const targetTypeLabel = (t: DataSourceRow["taskType"]) => t;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">采集任务管理</h1>
        <p className="text-sm text-muted-foreground mt-1">主题配置中已添加的所有数据源汇总，统一查看调度方式、采集平台与抓取目标</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">采集任务列表</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索任务ID/名称/主题..."
                  className="pl-8 w-60"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={themeFilter} onValueChange={setThemeFilter}>
                <SelectTrigger className="w-44"><SelectValue placeholder="所属主题" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部主题</SelectItem>
                  {ALL_THEMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="任务类型" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <ListFilter className="w-4 h-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="enabled">启用</SelectItem>
                  <SelectItem value="disabled">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground mb-3">
            提示：此处的数据源由各主题在「主题配置 → 第 2 步：数据源」中创建。如需新增/编辑详细配置，请前往
            <Link to="/datacenter/themes" className="text-primary inline-flex items-center gap-1 mx-1 hover:underline">
              主题配置 <ExternalLink className="w-3 h-3" />
            </Link>
            。
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">任务ID</TableHead>
                <TableHead>任务名称</TableHead>
                <TableHead>所属主题</TableHead>
                <TableHead>任务类型</TableHead>
                <TableHead>采集平台</TableHead>
                <TableHead>调度方式</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.taskId}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => navigate(`/datacenter/themes?themeId=${r.themeId}&action=edit&step=2&dsTaskId=${r.taskId}`)}
                      className="font-mono text-xs text-primary hover:underline"
                      title="点击跳转到对应主题配置第 2 步并展开此数据源"
                    >
                      {r.taskId}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{r.taskName}</TableCell>
                  <TableCell>
                    <Link to="/datacenter/themes" className="text-primary hover:underline text-sm">{r.themeName}</Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{r.taskType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {r.platforms.slice(0, 2).map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                      {r.platforms.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{r.platforms.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{r.schedule}</span>
                  </TableCell>
                  <TableCell>
                    <Switch checked={r.enabled} onCheckedChange={() => toggleStatus(r.taskId)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="查看明细" onClick={() => setDetailRow(r)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="编辑配置（跳转对应主题）"
                        onClick={() => navigate(`/datacenter/themes?themeId=${r.themeId}&action=edit&step=2&dsTaskId=${r.taskId}`)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">暂无符合条件的数据源</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 数据源详情侧滑抽屉（只读） */}
      <Sheet open={!!detailRow} onOpenChange={(o) => !o && setDetailRow(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
          {detailRow && (
            <>
              <SheetHeader className="p-6 pb-4 border-b">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{detailRow.taskType}</Badge>
                  <Badge
                    variant="secondary"
                    className={detailRow.enabled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground"}
                  >
                    {detailRow.enabled ? "运行中" : "已停用"}
                  </Badge>
                  <span className="font-mono text-[11px] text-muted-foreground">{detailRow.taskId}</span>
                </div>
                <SheetTitle className="text-lg">{detailRow.taskName}</SheetTitle>
                <SheetDescription className="text-xs">
                  所属主题：<Link to="/datacenter/themes" className="text-primary hover:underline">{detailRow.themeName}</Link>
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6 text-sm">
                  {/* 基本信息：只保留调度方式 + 平台 + 抓什么数据 */}
                  <section>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />任务基本信息
                    </h3>
                    <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                      <InfoItem icon={<Hash className="w-3 h-3" />} label="任务ID" value={detailRow.taskId} mono />
                      <InfoItem icon={<Tag className="w-3 h-3" />} label="任务类型" value={detailRow.taskType} />
                      <InfoItem icon={<Clock className="w-3 h-3" />} label="调度方式" value={detailRow.schedule} />
                      <InfoItem label="状态" value={detailRow.enabled ? "运行中" : "已停用"} />
                    </div>
                  </section>

                  {/* 采集平台 */}
                  <section>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-2">采集平台</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {detailRow.platforms.map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </section>

                  {/* 抓取目标 */}
                  <section>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                      抓取{targetTypeLabel(detailRow.taskType)}（共 {detailRow.targets.length} 项）
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {detailRow.targets.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs font-normal bg-muted/40">{t}</Badge>
                      ))}
                      {detailRow.targets.length === 0 && (
                        <span className="text-xs text-muted-foreground">未配置</span>
                      )}
                    </div>
                  </section>
                </div>
              </ScrollArea>

              <div className="border-t p-4 flex items-center justify-between gap-3 bg-muted/20">
                <p className="text-[11px] text-muted-foreground">只读视图，如需修改请前往主题配置</p>
                <Button
                  size="sm"
                  onClick={() => {
                    navigate(`/datacenter/themes?themeId=${detailRow.themeId}&action=edit&step=2&dsTaskId=${detailRow.taskId}`);
                    setDetailRow(null);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />前往编辑
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InfoItem({ icon, label, value, mono }: { icon?: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
        {icon}{label}
      </span>
      <span className={`text-xs text-foreground font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
