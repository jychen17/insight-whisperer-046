import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Play, Pause, RotateCcw, Trash2, ListFilter } from "lucide-react";

interface Task {
  id: string;
  name: string;
  source: string;
  platform: string;
  status: "running" | "paused" | "error" | "completed";
  frequency: string;
  lastRun: string;
  totalCollected: number;
  todayCollected: number;
}

const mockTasks: Task[] = [
  { id: "T001", name: "微博品牌舆情采集", source: "微博API", platform: "微博", status: "running", frequency: "每5分钟", lastRun: "2分钟前", totalCollected: 128450, todayCollected: 1284 },
  { id: "T002", name: "抖音热点视频采集", source: "抖音开放平台", platform: "抖音", status: "running", frequency: "每10分钟", lastRun: "5分钟前", totalCollected: 85620, todayCollected: 856 },
  { id: "T003", name: "小红书口碑监测", source: "小红书API", platform: "小红书", status: "paused", frequency: "每15分钟", lastRun: "2小时前", totalCollected: 42300, todayCollected: 0 },
  { id: "T004", name: "知乎行业问答采集", source: "知乎开放平台", platform: "知乎", status: "running", frequency: "每30分钟", lastRun: "12分钟前", totalCollected: 36780, todayCollected: 423 },
  { id: "T005", name: "B站视频评论采集", source: "B站API", platform: "B站", status: "error", frequency: "每10分钟", lastRun: "1小时前", totalCollected: 67200, todayCollected: 0 },
  { id: "T006", name: "新闻媒体资讯抓取", source: "RSS聚合", platform: "多平台", status: "running", frequency: "每小时", lastRun: "28分钟前", totalCollected: 215600, todayCollected: 2150 },
  { id: "T007", name: "电商评价数据采集", source: "京东/淘宝API", platform: "电商平台", status: "completed", frequency: "每日一次", lastRun: "今日 06:00", totalCollected: 98400, todayCollected: 673 },
];

const statusMap: Record<Task["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  running: { label: "运行中", variant: "default" },
  paused: { label: "已暂停", variant: "secondary" },
  error: { label: "异常", variant: "destructive" },
  completed: { label: "已完成", variant: "outline" },
};

const stats = [
  { label: "运行中任务", value: "4", color: "text-emerald-500" },
  { label: "今日采集量", value: "5,386", color: "text-primary" },
  { label: "异常任务", value: "1", color: "text-destructive" },
  { label: "总数据量", value: "674,350", color: "text-foreground" },
];

export default function CollectionTasks() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = mockTasks.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">采集任务管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理和监控所有数据采集任务的运行状态</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> 新建任务</Button>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">任务列表</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索任务名称..." className="pl-8 w-60" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <ListFilter className="w-4 h-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="running">运行中</SelectItem>
                  <SelectItem value="paused">已暂停</SelectItem>
                  <SelectItem value="error">异常</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务名称</TableHead>
                <TableHead>数据源</TableHead>
                <TableHead>采集频率</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">今日采集</TableHead>
                <TableHead className="text-right">累计采集</TableHead>
                <TableHead>最近运行</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell className="text-muted-foreground">{task.source}</TableCell>
                  <TableCell className="text-muted-foreground">{task.frequency}</TableCell>
                  <TableCell>
                    <Badge variant={statusMap[task.status].variant}>{statusMap[task.status].label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{task.todayCollected.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{task.totalCollected.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{task.lastRun}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {task.status === "running" ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Pause className="w-4 h-4" /></Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Play className="w-4 h-4" /></Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8"><RotateCcw className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
