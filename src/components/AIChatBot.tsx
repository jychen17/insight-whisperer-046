import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, X, Send, Sparkles, BarChart3, Settings, Search, Maximize2, Minimize2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: QuickAction[];
}

interface QuickAction {
  label: string;
  icon: typeof BarChart3;
  action: string;
}

const quickPrompts = [
  { label: "分析品牌声量趋势", icon: BarChart3, prompt: "请帮我分析同程旅行近7天的品牌声量趋势，并和竞品对比" },
  { label: "一键配置监控任务", icon: Settings, prompt: "请帮我创建一个新的监控任务，监控微博和小红书上关于同程旅行的舆情" },
  { label: "搜索热点话题", icon: Search, prompt: "帮我查看当前旅游行业的热点话题有哪些" },
  { label: "生成分析报告", icon: Sparkles, prompt: "请基于最近一周的数据，生成一份舆情分析报告摘要" },
];

const mockResponses: Record<string, { content: string; actions?: QuickAction[] }> = {
  "声量": {
    content: `📊 **同程旅行近7天品牌声量分析**

| 日期 | 同程旅行 | 携程 | 飞猪 | 去哪儿 |
|------|---------|------|------|--------|
| 3/25 | 1,245 | 2,130 | 890 | 756 |
| 3/26 | 1,380 | 1,980 | 920 | 812 |
| 3/27 | 1,520 | 2,240 | 1,050 | 780 |
| 3/28 | 2,890 | 2,100 | 940 | 830 |
| 3/29 | 1,670 | 2,350 | 1,120 | 895 |
| 3/30 | 1,450 | 2,180 | 980 | 760 |
| 3/31 | 1,580 | 2,290 | 1,060 | 840 |

**关键发现：**
- 3/28声量异常突增至2,890，主要来源为微博平台的一则用户投诉贴发酵
- 整体SOV占比约23.5%，低于携程(34.2%)
- 负面情感占比从12%上升至18%，需要关注

是否需要我进一步分析3/28的异常事件？`,
    actions: [
      { label: "查看3/28异常详情", icon: Search, action: "drill_down" },
      { label: "导出数据", icon: BarChart3, action: "export" },
    ],
  },
  "监控": {
    content: `✅ **已为您配置监控任务草案**

**任务名称：** 同程旅行舆情监控-微博&小红书
**监控平台：** 微博、小红书
**关键词组：** 同程品牌词（同程旅行、同程旅游、同程艺龙等5个）
**采集频率：** 每5分钟
**AI标签：** 情感分析、业务类型、风险等级
**分流规则：** 负面舆情自动进入舆情主题

**预计日采集量：** ~2,000条

⚠️ 该任务将关联以下规则：
- 舆情主题分流规则（TR01）
- 负面舆情突增预警（AL01）

确认创建此任务吗？`,
    actions: [
      { label: "确认创建", icon: Settings, action: "confirm" },
      { label: "修改配置", icon: Settings, action: "edit" },
    ],
  },
  "热点": {
    content: `🔥 **当前旅游行业热点话题 TOP5**

1. **#清明假期出行攻略#** 🔴 热度 9,280
   - 主要平台：小红书、抖音
   - 情感倾向：正面为主(78%)
   
2. **#某OTA平台退票纠纷#** 🟡 热度 6,540
   - 主要平台：微博、黑猫投诉
   - 情感倾向：负面(92%)，需要关注
   
3. **#春日赏花目的地推荐#** 🟢 热度 5,890
   - 主要平台：小红书、抖音
   
4. **#高铁出行新规解读#** 🟡 热度 4,230
   - 主要平台：微博、今日头条
   
5. **#酒店民宿价格对比#** 🟢 热度 3,670
   - 主要平台：小红书

需要我针对某个热点做深入分析吗？`,
  },
  "报告": {
    content: `📋 **舆情分析周报摘要（3/25 - 3/31）**

**一、整体概览**
- 总采集数据：12,345条
- 负面占比：15.2%（↑3.1%）
- 重大舆情事件：2起
- 预警触发：8次

**二、关键发现**
1. 3/28微博用户@旅行达人XX 发布投诉贴，48小时内获得2,890次互动，已触发重大预警
2. 小红书平台用户反馈酒店服务质量问题增多，日均投诉量同比增加25%
3. 行业竞品携程发布新产品"超级会员"，引发行业讨论

**三、建议措施**
- 针对3/28事件，建议公关部48小时内回应
- 加强酒店服务质量监控，建议增加相关关键词
- 关注竞品新产品动态，评估对自身业务影响

是否需要我生成完整报告并发送？`,
    actions: [
      { label: "生成完整报告", icon: Sparkles, action: "generate" },
      { label: "发送给相关人", icon: Settings, action: "send" },
    ],
  },
};

function getResponse(input: string): { content: string; actions?: QuickAction[] } {
  const lower = input.toLowerCase();
  if (lower.includes("声量") || lower.includes("趋势") || lower.includes("对比")) return mockResponses["声量"];
  if (lower.includes("监控") || lower.includes("任务") || lower.includes("配置") || lower.includes("创建")) return mockResponses["监控"];
  if (lower.includes("热点") || lower.includes("话题")) return mockResponses["热点"];
  if (lower.includes("报告") || lower.includes("分析") || lower.includes("摘要")) return mockResponses["报告"];
  return {
    content: `我理解您的需求。作为AI助手，我可以帮您：

1. **数据分析** - 分析品牌声量、竞品对比、情感趋势等
2. **监控配置** - 一键创建采集任务、设置预警规则
3. **热点洞察** - 发现行业热点、追踪话题传播
4. **报告生成** - 自动生成各类分析报告

请告诉我您具体需要什么帮助？`,
  };
}

export default function AIChatBot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 您好！我是AI洞察助手，可以帮您：\n\n- 📊 基于数据进行智能分析\n- ⚙️ 一键配置监控任务\n- 🔍 搜索和分析热点话题\n- 📋 自动生成分析报告\n\n请问有什么可以帮您的？",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const resp = getResponse(msg);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: resp.content,
        timestamp: new Date(),
        actions: resp.actions,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1200);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive animate-pulse" />
      </button>
    );
  }

  return (
    <div className={`fixed z-50 bg-card border border-border rounded-xl shadow-2xl flex flex-col transition-all ${
      expanded
        ? "bottom-4 right-4 w-[600px] h-[700px]"
        : "bottom-6 right-6 w-[400px] h-[560px]"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">AI 洞察助手</p>
            <p className="text-[10px] text-muted-foreground">智能分析 · 一键配置 · 即时问答</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}>
              <div className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.content}</div>
              {msg.actions && (
                <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/20">
                  {msg.actions.map((a) => (
                    <Button
                      key={a.label}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 bg-background/80"
                      onClick={() => handleSend(a.label)}
                    >
                      <a.icon className="w-3 h-3" />
                      {a.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-muted-foreground mb-2">快速操作</p>
          <div className="grid grid-cols-2 gap-1.5">
            {quickPrompts.map((p) => (
              <button
                key={p.label}
                onClick={() => handleSend(p.prompt)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent text-left transition-colors"
              >
                <p.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs text-foreground">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="输入问题或指令..."
            className="flex-1 h-9 text-sm"
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
