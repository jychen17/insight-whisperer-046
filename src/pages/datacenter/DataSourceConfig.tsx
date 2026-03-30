import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Globe, MessageSquare, Video, ShoppingBag, Newspaper, Settings2 } from "lucide-react";

const dataSources = [
  { name: "微博", icon: MessageSquare, type: "社交媒体", status: true, apis: 3, dailyQuota: 50000, used: 32400, color: "text-red-500" },
  { name: "抖音", icon: Video, type: "短视频", status: true, apis: 2, dailyQuota: 30000, used: 18600, color: "text-foreground" },
  { name: "小红书", icon: MessageSquare, type: "社交媒体", status: false, apis: 2, dailyQuota: 20000, used: 0, color: "text-rose-500" },
  { name: "知乎", icon: Globe, type: "问答社区", status: true, apis: 1, dailyQuota: 15000, used: 8900, color: "text-blue-500" },
  { name: "B站", icon: Video, type: "视频平台", status: true, apis: 2, dailyQuota: 25000, used: 14200, color: "text-sky-500" },
  { name: "京东/淘宝", icon: ShoppingBag, type: "电商平台", status: true, apis: 4, dailyQuota: 40000, used: 22800, color: "text-amber-500" },
  { name: "新闻媒体", icon: Newspaper, type: "RSS聚合", status: true, apis: 12, dailyQuota: 100000, used: 65400, color: "text-emerald-500" },
  { name: "论坛社区", icon: Globe, type: "BBS", status: false, apis: 5, dailyQuota: 10000, used: 0, color: "text-violet-500" },
];

export default function DataSourceConfig() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">数据源配置</h1>
          <p className="text-sm text-muted-foreground mt-1">管理平台接入的数据源及API配置</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> 添加数据源</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dataSources.map((ds) => {
          const Icon = ds.icon;
          const usagePercent = ds.dailyQuota > 0 ? Math.round((ds.used / ds.dailyQuota) * 100) : 0;
          return (
            <Card key={ds.name} className={!ds.status ? "opacity-60" : ""}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${ds.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{ds.name}</p>
                      <p className="text-xs text-muted-foreground">{ds.type}</p>
                    </div>
                  </div>
                  <Switch checked={ds.status} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>API接口数</span>
                    <span className="text-foreground">{ds.apis}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>日配额用量</span>
                    <span className="text-foreground">{ds.used.toLocaleString()} / {ds.dailyQuota.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full ${usagePercent > 80 ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <Badge variant={ds.status ? "default" : "secondary"}>{ds.status ? "已启用" : "已停用"}</Badge>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"><Settings2 className="w-3 h-3" /> 配置</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
