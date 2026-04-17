import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, LayoutDashboard, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ThemeItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  owner: string;
  type: "builtin" | "custom";
  status: "active" | "inactive";
  dataCount: number;
  alertCount: number;
  updatedAt: string;
}

const allThemes: ThemeItem[] = [
  { id: "sentiment", name: "舆情主题", icon: "🛡️", description: "品牌声誉风险监测与预警", owner: "张三", type: "builtin", status: "active", dataCount: 1284, alertCount: 3, updatedAt: "2026-03-29" },
  { id: "industry", name: "行业资讯主题", icon: "🌐", description: "行业动态、竞品动向、市场趋势监测", owner: "李四", type: "builtin", status: "active", dataCount: 856, alertCount: 0, updatedAt: "2026-03-28" },
  { id: "hotspot", name: "热点洞察主题", icon: "⚡", description: "社媒热点发现、话题趋势追踪", owner: "王五", type: "builtin", status: "active", dataCount: 2150, alertCount: 1, updatedAt: "2026-03-27" },
  { id: "experience", name: "产品体验主题", icon: "💡", description: "用户反馈收集、产品问题洞察", owner: "赵六", type: "builtin", status: "active", dataCount: 673, alertCount: 2, updatedAt: "2026-03-26" },
  { id: "brand", name: "品牌口碑监测", icon: "📊", description: "品牌口碑评价与传播效果监测", owner: "孙七", type: "custom", status: "active", dataCount: 432, alertCount: 0, updatedAt: "2026-03-25" },
  { id: "crisis", name: "危机事件监测", icon: "🚨", description: "突发事件与危机舆情快速响应", owner: "张三", type: "custom", status: "inactive", dataCount: 0, alertCount: 0, updatedAt: "2026-03-20" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "启用", variant: "default" },
  inactive: { label: "停用", variant: "secondary" },
};

const typeConfig: Record<string, { label: string; variant: "default" | "outline" }> = {
  builtin: { label: "内置", variant: "outline" },
  custom: { label: "自定义", variant: "default" },
};

export default function ThemeList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = allThemes.filter((t) => {
    const matchSearch = !search || t.name.includes(search) || t.description.includes(search);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = allThemes.filter((t) => t.status === "active").length;
  const totalData = allThemes.reduce((s, t) => s + t.dataCount, 0);
  const totalAlerts = allThemes.reduce((s, t) => s + t.alertCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">更多主题</h1>
        <p className="text-sm text-muted-foreground mt-1">查看所有洞察主题，支持查看看板与详情</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">全部主题</p>
              <p className="text-xl font-bold text-foreground">{allThemes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">启用中</p>
              <p className="text-xl font-bold text-foreground">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">昨日数据总量</p>
              <p className="text-xl font-bold text-foreground">{totalData.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
              <span className="text-destructive text-sm">⚠</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">昨日预警</p>
              <p className="text-xl font-bold text-foreground">{totalAlerts}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">主题列表</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索主题名称..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>主题名称</TableHead>
                <TableHead>说明</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead className="text-right">今日数据</TableHead>
                <TableHead className="text-right">预警</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((theme) => {
                const sc = statusConfig[theme.status];
                const tc = typeConfig[theme.type];
                return (
                  <TableRow key={theme.id}>
                    <TableCell className="text-lg">{theme.icon}</TableCell>
                    <TableCell className="font-medium text-foreground">{theme.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{theme.description}</TableCell>
                    <TableCell><Badge variant={tc.variant} className="text-xs">{tc.label}</Badge></TableCell>
                    <TableCell className="text-sm">{theme.owner}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{theme.dataCount > 0 ? theme.dataCount.toLocaleString() : "-"}</TableCell>
                    <TableCell className="text-right">
                      {theme.alertCount > 0 ? (
                        <Badge variant="destructive" className="text-xs">{theme.alertCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell><Badge variant={sc.variant} className="text-xs">{sc.label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{theme.updatedAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => navigate("/datacenter/themes/detail", { state: { themeId: theme.id } })}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          详情
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => navigate(`/${theme.id === "industry" ? "industry" : theme.id === "hotspot" ? "hotspot" : theme.id === "experience" ? "experience" : "sentiment"}/overview`)}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          看板
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    没有找到匹配的主题
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
