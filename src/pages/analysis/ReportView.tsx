import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Copy, FileText } from "lucide-react";
import { toast } from "sonner";
import ReportHtmlPreview from "@/components/ReportHtmlPreview";

export default function ReportView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [params] = useSearchParams();
  const title = params.get("title") || "舆情分析报告";
  const period = params.get("period") || "";
  const template = params.get("template") || "";
  const variant: "default" | "event" =
    template.includes("事件") || title.includes("事件") ? "event" : "default";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {title}
              {period && <Badge variant="outline" className="text-xs">{period}</Badge>}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("已复制报告链接")}>
            <Copy className="w-3.5 h-3.5" /> 复制链接
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => toast.success(`正在下载 ${title}（HTML）`)}>
            <Download className="w-3.5 h-3.5" /> 下载报告
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-background">
        <ReportHtmlPreview title={title} />
      </div>
    </div>
  );
}
