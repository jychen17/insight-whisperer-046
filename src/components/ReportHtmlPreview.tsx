import { Flame, AlertTriangle, Trophy, Sparkles, Bell, Lightbulb, FileText, BarChart3, Gamepad2, Clock, Smartphone, Zap, Wrench, Megaphone } from "lucide-react";

interface Props {
  title: string;
  date?: string;
  source?: string;
  variant?: "default" | "event";
}

/**
 * Mock HTML-style report body matching the screenshot reference.
 * Used inside the report preview dialog so users see what the generated
 * report looks like in HTML format.
 */
export default function ReportHtmlPreview({ title, date = "2026年4月15日", source = "灵泉舆情系统", variant = "default" }: Props) {
  if (variant === "event") {
    return <EventReport title={title} date={date} source={source} />;
  }
  return (
    <div className="bg-background space-y-5 text-sm">
      {/* Header banner */}
      <div className="rounded-lg p-6 text-white" style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)" }}>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5" />
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <p className="text-xs text-white/80">报告日期：{date} | 数据来源：{source}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="rounded-lg p-4 text-white text-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.75) 100%)" }}>
          <p className="text-2xl font-bold">285</p>
          <p className="text-xs mt-1">舆情总量</p>
          <p className="text-[10px] text-white/80 mt-1">5家OTA平台</p>
        </div>
        {[
          { v: "211", l: "负面舆情", s: "占比 74.0%", c: "text-destructive" },
          { v: "43", l: "正向舆情", s: "占比 15.1%", c: "text-success" },
          { v: "31", l: "中性舆情", s: "占比 10.9%", c: "text-warning" },
          { v: "161", l: "确认舆情", s: "占比 56.5%", c: "text-info" },
        ].map(k => (
          <div key={k.l} className="rounded-lg p-4 text-center bg-card border border-border">
            <p className={`text-2xl font-bold ${k.c}`}>{k.v}</p>
            <p className="text-xs text-foreground mt-1">{k.l}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{k.s}</p>
          </div>
        ))}
      </div>

      {/* OTA platform comparison */}
      <Section icon={<BarChart3 className="w-4 h-4 text-primary" />} title="OTA平台舆情对比">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="text-left py-2 font-medium">平台</th>
              <th className="text-left py-2 font-medium">总量</th>
              <th className="text-left py-2 font-medium">负面</th>
              <th className="text-left py-2 font-medium">正向</th>
              <th className="text-left py-2 font-medium">中性</th>
              <th className="text-left py-2 font-medium">负面率</th>
            </tr>
          </thead>
          <tbody>
            {[
              { p: "🏆 同程旅行", t: 106, n: 49, po: 42, m: 15, r: "46.2%", bold: true },
              { p: "携程", t: 58, n: 49, po: 4, m: 5, r: "84.5%" },
              { p: "去哪儿网", t: 59, n: 56, po: 3, m: 0, r: "94.9%" },
              { p: "飞猪", t: 49, n: 45, po: 3, m: 1, r: "91.8%" },
              { p: "美团旅行", t: 13, n: 12, po: 0, m: 1, r: "92.3%" },
            ].map(row => (
              <tr key={row.p} className="border-b border-border/60 text-sm">
                <td className={`py-2.5 ${row.bold ? "font-semibold" : ""}`}>{row.p}</td>
                <td className="py-2.5">{row.t}</td>
                <td className="py-2.5 text-destructive">{row.n}</td>
                <td className="py-2.5 text-success">{row.po}</td>
                <td className="py-2.5 text-warning">{row.m}</td>
                <td className="py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive">{row.r}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Core events */}
      <Section icon={<Flame className="w-4 h-4 text-destructive" />} title="核心事件">
        <div className="space-y-3">
          <EventCard
            level="high"
            title="多平台被指&ldquo;大数据杀熟&rdquo;，用户集体投诉票价问题"
            content={`4月15日，大量用户在社交平台投诉携程、飞猪、去哪儿网、同程等OTA平台机票价格频繁波动，质疑存在&ldquo;大数据杀熟&rdquo;行为。用户反馈搜索机票后价格快速上涨，部分用户表示&ldquo;看了几次价格就涨了&rdquo;，引发用户强烈不满，部分用户威胁卸载平台。`}
            tags={["涉及平台：全平台", "影响范围：高", "持续发酵中"]}
          />
          <EventCard
            level="medium"
            title="携程代理商被曝冒用用户身份信息购票"
            content={`用户投诉携程代理商在未经授权情况下使用其个人信息购买机票，存在严重的信息安全风险。用户发现退票后航司系统仍显示&ldquo;未使用&rdquo;，且名下凭空多出一张机票。携程客服初否认，后承认系代理方&ldquo;实习生误操作&rdquo;。`}
            tags={["来源：黑猫投诉", "风险等级：高"]}
          />
          <EventCard
            level="medium"
            title="美团用户订票后遭遇精准诈骗，疑信息泄露"
            content="用户在美团订票后收到香港IP诈骗电话，对方准确报出航班信息，以&ldquo;航班故障&rdquo;为由诱导点击钓鱼链接。用户识别后举报，质疑美团存在用户信息泄露问题。"
            tags={["来源：小红书", "风险等级：中"]}
          />
        </div>
      </Section>

      {/* Trophy section */}
      <Section icon={<Trophy className="w-4 h-4 text-warning" />} title="同程旅行舆情态势">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-2">情感分布</p>
            <div className="h-3 rounded-full overflow-hidden flex">
              <div className="bg-success" style={{ width: "40%" }} />
              <div className="bg-destructive" style={{ width: "46%" }} />
              <div className="bg-warning" style={{ width: "14%" }} />
            </div>
            <div className="flex gap-3 mt-2 text-xs flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-success inline-block rounded-sm" />正向 42条</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-destructive inline-block rounded-sm" />负面 49条</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-warning inline-block rounded-sm" />中性 15条</span>
            </div>
            <p className="text-xs text-muted-foreground mt-4 mb-2">主要问题分布</p>
            <div className="flex gap-2 flex-wrap">
              {["票价吐槽 21条", "机票跟风吐槽 9条", "其他问题 8条", "辅营加购 7条", "催出票 1条"].map(t => (
                <span key={t} className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">{t}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">平台分布</p>
            <div className="grid grid-cols-2 gap-2">
              {[["黑猫投诉", 34], ["快手", 30], ["小红书", 14], ["新浪微博", 11], ["抖音", 10], ["今日头条", 5]].map(([n, v]) => (
                <div key={n as string} className="flex items-center justify-between text-xs px-3 py-2 rounded bg-muted/40 border border-border">
                  <span>{n}</span><span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Risk warning */}
      <Section icon={<Bell className="w-4 h-4 text-destructive" />} title="风险预警">
        <div className="space-y-2">
          {[
            { l: "高", t: "票价波动投诉持续发酵", d: "多平台被指&ldquo;大数据杀熟&rdquo;，用户集体投诉机票价格频繁波动，可能引发监管关注和媒体曝光。", c: "destructive" },
            { l: "高", t: "用户信息安全风险", d: "携程代理商冒用用户身份信息购票事件引发关注，需警惕信息泄露风险传导至同程。", c: "destructive" },
            { l: "中", t: "病退政策争议", d: "多个平台病退政策引发用户不满，需关注政策透明度和客服处理规范性。", c: "warning" },
            { l: "中", t: "退改签收费争议", d: "用户对退票手续费标准存在较大争议，部分用户质疑收费不合理。", c: "warning" },
          ].map(r => (
            <div key={r.t} className={`flex items-start gap-3 rounded-lg p-3 border-l-4 ${r.c === "destructive" ? "bg-destructive/5 border-destructive" : "bg-warning/5 border-warning"}`}>
              <span className={`text-xs font-bold rounded px-2 py-0.5 shrink-0 ${r.c === "destructive" ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}`}>{r.l}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground" dangerouslySetInnerHTML={{ __html: r.t }} />
                <p className="text-xs text-muted-foreground mt-0.5" dangerouslySetInnerHTML={{ __html: r.d }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Suggestions */}
      <Section icon={<Lightbulb className="w-4 h-4 text-warning" />} title="舆情应对建议">
        <div className="space-y-2">
          {[
            "加强价格透明度：针对&ldquo;杀熟&rdquo;质疑，建议公示定价机制，增强用户信任。可考虑推出&ldquo;价格保护&rdquo;政策，提升用户满意度。",
            "优化退改签流程：简化病退申请流程，明确政策说明，避免因政策不透明引发投诉。建议对特殊情况进行人性化处理。",
            "提升客服响应效率：对出票延迟、退票处理慢等问题建立快速响应机制，设置合理时限并主动告知用户进度。",
            "强化信息安全保障：借鉴携程事件教训，加强代理商管理，确保用户信息安全，避免类似风险。",
            "主动正面宣传：利用正向舆情亮点（特价票、优惠活动）加强社媒传播，对冲负面舆情影响。",
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg p-3 bg-info/5 border border-info/20">
              <span className="w-6 h-6 rounded-full bg-info text-info-foreground text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: s }} />
            </div>
          ))}
        </div>
      </Section>

      <div className="text-center text-xs text-muted-foreground py-3 border-t border-border space-y-1">
        <p className="flex items-center justify-center gap-2"><FileText className="w-3 h-3" />数据来源：灵泉舆情分析系统 | 报告生成时间：2026年4月16日</p>
        <p>如需查看详细数据，请访问灵泉舆情系统</p>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border">
        {icon}
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EventCard({ level, title, content, tags }: { level: "high" | "medium"; title: string; content: string; tags: string[] }) {
  const styles = level === "high"
    ? "border-l-destructive bg-destructive/5"
    : "border-l-warning bg-warning/5";
  return (
    <div className={`rounded-lg p-4 border-l-4 ${styles}`}>
      <p className="font-semibold text-foreground flex items-start gap-1.5">
        <AlertTriangle className={`w-4 h-4 mt-0.5 ${level === "high" ? "text-destructive" : "text-warning"}`} />
        <span dangerouslySetInnerHTML={{ __html: title }} />
      </p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
      <div className="flex gap-3 mt-3 flex-wrap text-[11px] text-muted-foreground">
        {tags.map(t => <span key={t}>📌 {t}</span>)}
      </div>
    </div>
  );
}
