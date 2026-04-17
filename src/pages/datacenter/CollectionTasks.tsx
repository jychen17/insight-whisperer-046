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
import { Separator } from "@/components/ui/separator";
import { Search, ListFilter, Eye, Edit2, ExternalLink, Calendar, Clock, User, Tag, Database, Filter } from "lucide-react";

interface DataSourceRow {
  taskId: string;
  taskName: string;
  themeId: string;
  themeName: string;
  taskType: "话题" | "账号" | "关键词" | "链接";
  platforms: string[];
  schedule: string;
  periodEnd: string;
  enabled: boolean;
  owner: string;
  yesterdayCount: number;
  updatedAt: string;
  // 详情用：第二步数据源完整配置
  taskParams?: { label: string; value: string }[];
  extendedParams?: { label: string; value: string }[];
  conditionExpr?: string;
  fields?: string[];
  description?: string;
}

// Mock 数据：所有主题里第二步配置的数据源汇总
const mockSources: DataSourceRow[] = [
  { taskId: "ds_t001", taskName: "同程品牌全网监控", themeId: "brand_safety", themeName: "品牌安全监测", taskType: "关键词", platforms: ["新浪微博", "小红书", "抖音"], schedule: "每 6 小时", periodEnd: "2026-12-31", enabled: true, owner: "陈佳燕-1227152", yesterdayCount: 1284, updatedAt: "2026-04-16 15:20" },
  { taskId: "ds_t002", taskName: "竞品话题追踪", themeId: "brand_safety", themeName: "品牌安全监测", taskType: "话题", platforms: ["新浪微博", "知乎"], schedule: "每 2 小时", periodEnd: "2026-12-31", enabled: true, owner: "陈佳燕-1227152", yesterdayCount: 856, updatedAt: "2026-04-15 10:12" },
  { taskId: "ds_t003", taskName: "酒店投诉账号监控", themeId: "hotel_quality", themeName: "酒店服务质量", taskType: "账号", platforms: ["黑猫投诉", "消费保"], schedule: "每 4 小时", periodEnd: "2026-09-30", enabled: true, owner: "张三", yesterdayCount: 423, updatedAt: "2026-04-14 09:30" },
  { taskId: "ds_t004", taskName: "机票退改关键词", themeId: "flight_refund", themeName: "机票退改舆情", taskType: "关键词", platforms: ["新浪微博", "今日头条", "百度"], schedule: "每 1 小时", periodEnd: "2026-06-30", enabled: false, owner: "李四", yesterdayCount: 0, updatedAt: "2026-04-10 18:00" },
  { taskId: "ds_t005", taskName: "度假产品口碑链接", themeId: "vacation_review", themeName: "度假产品口碑", taskType: "链接", platforms: ["小红书", "B站"], schedule: "每 12 小时", periodEnd: "2026-12-31", enabled: true, owner: "王五", yesterdayCount: 215, updatedAt: "2026-04-16 08:45" },
  { taskId: "ds_t006", taskName: "高铁出行话题", themeId: "train_topic", themeName: "高铁出行洞察", taskType: "话题", platforms: ["新浪微博"], schedule: "每 6 小时", periodEnd: "2026-12-31", enabled: true, owner: "赵六", yesterdayCount: 673, updatedAt: "2026-04-13 14:20" },
  { taskId: "ds_t007", taskName: "民宿差评关键词", themeId: "hotel_quality", themeName: "酒店服务质量", taskType: "关键词", platforms: ["小红书", "抖音", "快手"], schedule: "每 3 小时", periodEnd: "2026-08-31", enabled: true, owner: "张三", yesterdayCount: 512, updatedAt: "2026-04-15 22:10" },
];

const TASK_TYPES = ["话题", "账号", "关键词", "链接"];
const ALL_THEMES = Array.from(new Set(mockSources.map((s) => s.themeName)));

export default function CollectionTasks() {
  const [search, setSearch] = useState("");
  const [themeFilter, setThemeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState(mockSources);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search && !r.taskName.includes(search) && !r.themeName.includes(search)) return false;
      if (themeFilter !== "all" && r.themeName !== themeFilter) return false;
      if (typeFilter !== "all" && r.taskType !== typeFilter) return false;
      if (statusFilter === "enabled" && !r.enabled) return false;
      if (statusFilter === "disabled" && r.enabled) return false;
      return true;
    });
  }, [rows, search, themeFilter, typeFilter, statusFilter]);

  const stats = useMemo(() => ([
    { label: "数据源总数", value: rows.length, color: "text-foreground" },
    { label: "启用中", value: rows.filter((r) => r.enabled).length, color: "text-emerald-500" },
    { label: "覆盖主题", value: new Set(rows.map((r) => r.themeId)).size, color: "text-primary" },
    { label: "昨日采集量", value: rows.reduce((s, r) => s + r.yesterdayCount, 0).toLocaleString(), color: "text-foreground" },
  ]), [rows]);

  const toggleStatus = (taskId: string) => {
    setRows((prev) => prev.map((r) => (r.taskId === taskId ? { ...r, enabled: !r.enabled } : r)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">采集任务管理</h1>
        <p className="text-sm text-muted-foreground mt-1">主题配置中已添加的所有数据源汇总，统一管理执行状态、采集周期和负责人</p>
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
            <CardTitle className="text-base">数据源列表</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索任务/主题名称..."
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
                <TableHead>数据源名称</TableHead>
                <TableHead>所属主题</TableHead>
                <TableHead>任务类型</TableHead>
                <TableHead>采集平台</TableHead>
                <TableHead>调度频率</TableHead>
                <TableHead>截止日期</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead className="text-right">昨日采集</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.taskId}>
                  <TableCell className="font-medium">{r.taskName}</TableCell>
                  <TableCell>
                    <Link to="/datacenter/themes" className="text-primary hover:underline text-sm">{r.themeName}</Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{r.taskType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {r.platforms.slice(0, 2).map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                      {r.platforms.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{r.platforms.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.schedule}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.periodEnd}</TableCell>
                  <TableCell className="text-sm">{r.owner}</TableCell>
                  <TableCell className="text-right">{r.yesterdayCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Switch checked={r.enabled} onCheckedChange={() => toggleStatus(r.taskId)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="查看明细">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="编辑配置（跳转主题配置）" asChild>
                        <Link to="/datacenter/themes"><Edit2 className="w-4 h-4" /></Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">暂无符合条件的数据源</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
