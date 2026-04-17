import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Plus, Search, Trash2, Edit2, Download, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { toast } from "sonner";

interface KeywordRow {
  id: string;
  keyword: string;
  platform: string;
  taskName: string;
  crawlerName: string;
  status: boolean;
  yesterdayCount: number;
  dayOverDay: number; // 环比百分比
  operator: string;
  updatedAt: string;
}

const PLATFORMS = ["百度贴吧", "百度视频", "百家号", "小红书", "新浪微博", "抖音", "今日头条", "快手", "快手app", "百度", "知乎", "B站"];
const KEYWORDS = ["同程", "艺龙", "万达酒店", "同程旅行", "同程金服"];
const TASKS = ["同程-基础监控", "万达-基础监控", "艺龙-品牌监控"];

const generateMockData = (): KeywordRow[] => {
  const rows: KeywordRow[] = [];
  let id = 1;
  KEYWORDS.forEach((kw) => {
    PLATFORMS.forEach((pf) => {
      const yc = Math.random() > 0.6 ? Math.floor(Math.random() * 200) : 0;
      const dod = yc === 0 ? (Math.random() > 0.5 ? -100 : 0) : Math.floor(Math.random() * 200) - 100;
      rows.push({
        id: `KW${String(id).padStart(4, "0")}`,
        keyword: kw,
        platform: pf,
        taskName: TASKS[id % TASKS.length],
        crawlerName: `舆情爬虫-${1000 + (id % 5)}`,
        status: Math.random() > 0.1,
        yesterdayCount: yc,
        dayOverDay: dod,
        operator: "陈佳燕-1227152",
        updatedAt: "2026-04-16 15:20:21",
      });
      id++;
    });
  });
  return rows;
};

const ALL_DATA = generateMockData();

const PAGE_SIZE = 10;

export default function KeywordManage() {
  const [keywordFilter, setKeywordFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState("updated_desc");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    let data = ALL_DATA.filter((r) => {
      if (keywordFilter && !r.keyword.includes(keywordFilter)) return false;
      if (platformFilter !== "all" && r.platform !== platformFilter) return false;
      if (statusFilter === "enabled" && !r.status) return false;
      if (statusFilter === "disabled" && r.status) return false;
      return true;
    });
    if (sortMode === "updated_desc") data = [...data].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (sortMode === "updated_asc") data = [...data].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    if (sortMode === "count_desc") data = [...data].sort((a, b) => b.yesterdayCount - a.yesterdayCount);
    return data;
  }, [keywordFilter, platformFilter, statusFilter, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = () => { setPage(1); };
  const handleExport = () => { toast.success(`已导出 ${filtered.length} 条数据`); };

  const renderDoD = (v: number) => {
    if (v === 0) return <span className="inline-flex items-center gap-1 text-muted-foreground"><Minus className="w-3 h-3" />日环比 0%</span>;
    if (v > 0) return <span className="inline-flex items-center gap-1 text-emerald-500"><ArrowUp className="w-3 h-3" />日环比 +{v}%</span>;
    return <span className="inline-flex items-center gap-1 text-destructive"><ArrowDown className="w-3 h-3" />日环比 {v}.00%</span>;
  };

  const pageNumbers = useMemo(() => {
    const nums: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
    } else {
      nums.push(1, 2, 3, 4, 5, "...", totalPages);
    }
    return nums;
  }, [totalPages]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">关键词管理</h1>
        <p className="text-sm text-muted-foreground mt-1">抓取关键词：主动抓取全网数据的核心词；管理品牌词、竞品词、行业词等</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4" /> 新建</Button>
              <Button variant="outline" className="gap-2"><Edit2 className="w-4 h-4" /> 批量编辑</Button>
              <Button variant="outline" className="gap-2 text-destructive"><Trash2 className="w-4 h-4" /> 批量删除</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="关键词"
              className="w-48"
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
            />
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="发布平台" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部平台</SelectItem>
                {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="enabled">启用</SelectItem>
                <SelectItem value="disabled">停用</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortMode} onValueChange={setSortMode}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_desc">更新时间降序</SelectItem>
                <SelectItem value="updated_asc">更新时间升序</SelectItem>
                <SelectItem value="count_desc">昨日抓取量降序</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2" onClick={handleSearch}><Search className="w-4 h-4" /> 查询</Button>
            <Button variant="outline" className="gap-2" onClick={handleExport}><Download className="w-4 h-4" /> 导出</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>关键词</TableHead>
                <TableHead>发布平台</TableHead>
                <TableHead>关联任务信息</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>昨日抓取总量</TableHead>
                <TableHead>创建/更新人</TableHead>
                <TableHead>创建/更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.map((r) => (
                <TableRow key={r.id} className={!r.status ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{r.keyword}</TableCell>
                  <TableCell>{r.platform}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-primary">{r.taskName}</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-muted-foreground">{r.crawlerName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={r.status ? "bg-primary/10 text-primary border-primary/20 border" : "bg-muted text-muted-foreground border"}>
                      {r.status ? "启用" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.yesterdayCount} 条</span>
                      <span className="text-xs">{renderDoD(r.dayOverDay)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.operator}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">暂无数据</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end gap-4 pt-2">
            <span className="text-sm text-muted-foreground">共 {filtered.length} 条</span>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
                </PaginationItem>
                {pageNumbers.map((n, i) => (
                  <PaginationItem key={i}>
                    {n === "..." ? <PaginationEllipsis /> : (
                      <PaginationLink href="#" isActive={n === page} onClick={(e) => { e.preventDefault(); setPage(n as number); }}>{n}</PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <Select value="10" onValueChange={() => {}}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10条/页</SelectItem>
                <SelectItem value="20">20条/页</SelectItem>
                <SelectItem value="50">50条/页</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建关键词</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">关键词（每行一个）</label>
              <Textarea placeholder="同程旅行&#10;同程旅游&#10;同程艺龙" rows={5} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">发布平台（可多选）</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="选择平台" /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">关联任务</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="选择任务" /></SelectTrigger>
                <SelectContent>
                  {TASKS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={() => { setDialogOpen(false); toast.success("关键词创建成功"); }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
