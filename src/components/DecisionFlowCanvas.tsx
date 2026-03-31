import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, ZoomIn, ZoomOut, Maximize2, Database, Cpu, Filter, LayoutDashboard, ChevronRight } from "lucide-react";

interface FlowNode {
  id: string;
  type: "source" | "process" | "rule" | "theme";
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  icon?: string;
  meta?: Record<string, string | number>;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  volume?: number;
  animated?: boolean;
}

interface RuleData {
  id: string;
  name: string;
  targetTheme: string;
  description: string;
  matchedCount: number;
  status: boolean;
  logic: string;
}

interface Props {
  rules: RuleData[];
  themes: string[];
  themeColors: Record<string, string>;
}

export default function DecisionFlowCanvas({ rules, themes, themeColors }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Build nodes
  const canvasW = 1200;
  const canvasH = 560;
  const colX = [60, 280, 500, 880];
  const activeRules = rules.filter(r => r.status);

  const sourceNodes: FlowNode[] = [
    { id: "src_pool", type: "source", label: "原始数据池", sublabel: "全平台采集", x: colX[0], y: 180, width: 150, height: 64, color: "source", meta: { "日均数据量": "~128K" } },
    { id: "src_realtime", type: "source", label: "实时数据流", sublabel: "Streaming", x: colX[0], y: 280, width: 150, height: 64, color: "source", meta: { "延迟": "<5s" } },
    { id: "src_history", type: "source", label: "历史存量数据", sublabel: "Batch Import", x: colX[0], y: 380, width: 150, height: 64, color: "source", meta: { "总量": "12.8M" } },
  ];

  const processNodes: FlowNode[] = [
    { id: "proc_ai", type: "process", label: "AI 特征提取", sublabel: "NLP / 情感 / 风险", x: colX[1], y: 220, width: 160, height: 64, color: "process" },
    { id: "proc_raw", type: "process", label: "原生字段解析", sublabel: "平台 / 时间 / 互动", x: colX[1], y: 330, width: 160, height: 64, color: "process" },
  ];

  const ruleNodes: FlowNode[] = activeRules.map((r, i) => ({
    id: `rule_${r.id}`,
    type: "rule" as const,
    label: r.name,
    sublabel: `${r.logic} · 命中 ${r.matchedCount.toLocaleString()}`,
    x: colX[2],
    y: 120 + i * 88,
    width: 200,
    height: 64,
    color: "rule",
    meta: { "目标": r.targetTheme, "命中量": r.matchedCount },
  }));

  const usedThemes = [...new Set(activeRules.map(r => r.targetTheme))];
  const themeNodes: FlowNode[] = usedThemes.map((t, i) => ({
    id: `theme_${t}`,
    type: "theme" as const,
    label: t,
    sublabel: `${activeRules.filter(r => r.targetTheme === t).length} 条规则`,
    x: colX[3],
    y: 140 + i * 100,
    width: 170,
    height: 68,
    color: "theme",
    icon: t,
  }));

  const allNodes = [...sourceNodes, ...processNodes, ...ruleNodes, ...themeNodes];

  // Build edges
  const edges: FlowEdge[] = [];
  sourceNodes.forEach(s => {
    processNodes.forEach(p => {
      edges.push({ from: s.id, to: p.id, animated: true });
    });
  });
  processNodes.forEach(p => {
    ruleNodes.forEach(r => {
      edges.push({ from: p.id, to: r.id });
    });
  });
  activeRules.forEach(r => {
    const ruleId = `rule_${r.id}`;
    const themeId = `theme_${r.targetTheme}`;
    edges.push({ from: ruleId, to: themeId, label: r.matchedCount.toLocaleString(), volume: r.matchedCount });
  });

  // Highlight logic
  const getConnectedIds = (nodeId: string) => {
    const connected = new Set<string>([nodeId]);
    const traverse = (id: string, direction: "forward" | "backward") => {
      edges.forEach(e => {
        if (direction === "forward" && e.from === id && !connected.has(e.to)) {
          connected.add(e.to);
          traverse(e.to, "forward");
        }
        if (direction === "backward" && e.to === id && !connected.has(e.from)) {
          connected.add(e.from);
          traverse(e.from, "backward");
        }
      });
    };
    traverse(nodeId, "forward");
    traverse(nodeId, "backward");
    return connected;
  };

  const highlightedIds = hoveredNode ? getConnectedIds(hoveredNode) : null;

  // Edge path
  const getEdgePath = (from: FlowNode, to: FlowNode) => {
    const x1 = from.x + from.width;
    const y1 = from.y + from.height / 2;
    const x2 = to.x;
    const y2 = to.y + to.height / 2;
    const cx = (x1 + x2) / 2;
    return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
  };

  // Pan & Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale(s => Math.max(0.4, Math.min(2, s + delta)));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).tagName === "rect" && (e.target as HTMLElement).getAttribute("data-bg") === "true") {
      setDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handleMouseUp = () => setDragging(false);

  const resetView = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  const nodeTypeIcon = (type: string) => {
    switch (type) {
      case "source": return <Database className="w-3.5 h-3.5" />;
      case "process": return <Cpu className="w-3.5 h-3.5" />;
      case "rule": return <Filter className="w-3.5 h-3.5" />;
      case "theme": return <LayoutDashboard className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const nodeColors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    source: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(var(--foreground))", iconBg: "hsl(var(--muted-foreground) / 0.15)" },
    process: { bg: "hsl(var(--primary) / 0.06)", border: "hsl(var(--primary) / 0.25)", text: "hsl(var(--foreground))", iconBg: "hsl(var(--primary) / 0.15)" },
    rule: { bg: "hsl(40 95% 55% / 0.06)", border: "hsl(40 95% 55% / 0.3)", text: "hsl(var(--foreground))", iconBg: "hsl(40 95% 55% / 0.15)" },
    theme: { bg: "hsl(var(--primary) / 0.08)", border: "hsl(var(--primary) / 0.35)", text: "hsl(var(--foreground))", iconBg: "hsl(var(--primary) / 0.2)" },
  };

  // Column headers
  const columnHeaders = [
    { x: colX[0], label: "数据源", icon: <Database className="w-3.5 h-3.5" /> },
    { x: colX[1], label: "特征提取", icon: <Cpu className="w-3.5 h-3.5" /> },
    { x: colX[2], label: "分流规则", icon: <Filter className="w-3.5 h-3.5" /> },
    { x: colX[3], label: "洞察主题", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  ];

  return (
    <Card className={`transition-all ${expanded ? "fixed inset-4 z-50 m-0" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" /> 可视化分流决策流
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.min(2, s + 0.15))}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.max(0.4, s - 0.15))}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetView}>
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs ml-1" onClick={() => setExpanded(!expanded)}>
              {expanded ? "退出全屏" : "全屏"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          拖拽画布平移 · 滚轮缩放 · 悬停节点高亮数据链路 · 当前缩放 {Math.round(scale * 100)}%
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative overflow-hidden border-t border-border bg-muted/20"
          style={{ height: expanded ? "calc(100vh - 140px)" : 440, cursor: dragging ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.35]">
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${canvasW} ${canvasH}`}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: "center" }}
          >
            {/* Animated defs */}
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" opacity="0.5" />
              </marker>
              <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" opacity="0.8" />
              </marker>
              <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Column headers */}
            {columnHeaders.map((col, i) => (
              <g key={i}>
                <rect x={col.x - 8} y={50} width={i === 2 ? 216 : i === 3 ? 186 : 166} height={28} rx={14} fill="hsl(var(--muted))" />
                <text x={col.x + (i === 2 ? 100 : i === 3 ? 85 : 75)} y={68} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11" fontWeight="500">{col.label}</text>
              </g>
            ))}

            {/* Edges */}
            {edges.map((edge, i) => {
              const fromNode = allNodes.find(n => n.id === edge.from);
              const toNode = allNodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const isHighlighted = highlightedIds && highlightedIds.has(edge.from) && highlightedIds.has(edge.to);
              const isDimmed = highlightedIds && !isHighlighted;
              const path = getEdgePath(fromNode, toNode);

              return (
                <g key={i}>
                  <path
                    d={path}
                    fill="none"
                    stroke={isHighlighted ? "hsl(var(--primary))" : "hsl(var(--border))"}
                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                    strokeDasharray={edge.animated ? "6 4" : "none"}
                    opacity={isDimmed ? 0.15 : isHighlighted ? 1 : 0.5}
                    markerEnd={isHighlighted ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                    className="transition-all duration-300"
                  >
                    {edge.animated && (
                      <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite" />
                    )}
                  </path>
                  {/* Volume label on rule→theme edges */}
                  {edge.label && isHighlighted && (
                    <text>
                      <textPath href={`#edge-path-${i}`} startOffset="50%" textAnchor="middle">
                        <tspan dy="-6" fill="hsl(var(--primary))" fontSize="9" fontWeight="600">{edge.label}</tspan>
                      </textPath>
                    </text>
                  )}
                  {edge.label && (
                    <path id={`edge-path-${i}`} d={path} fill="none" stroke="none" />
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {allNodes.map((node) => {
              const colors = nodeColors[node.color] || nodeColors.source;
              const isHovered = hoveredNode === node.id;
              const isDimmed = highlightedIds && !highlightedIds.has(node.id);
              const isActive = highlightedIds?.has(node.id);

              return (
                <g
                  key={node.id}
                  className="transition-all duration-200 cursor-pointer"
                  style={{ opacity: isDimmed ? 0.2 : 1 }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                >
                  {/* Shadow */}
                  <rect
                    x={node.x + 2} y={node.y + 2}
                    width={node.width} height={node.height}
                    rx={10}
                    fill="hsl(var(--foreground) / 0.06)"
                  />
                  {/* Body */}
                  <rect
                    x={node.x} y={node.y}
                    width={node.width} height={node.height}
                    rx={10}
                    fill={colors.bg}
                    stroke={isActive || isHovered ? "hsl(var(--primary))" : colors.border}
                    strokeWidth={isActive || isHovered ? 2 : 1}
                    className="transition-all duration-200"
                  />
                  {/* Icon circle */}
                  <circle cx={node.x + 22} cy={node.y + node.height / 2} r={12} fill={colors.iconBg} />
                  {/* Type indicator dot */}
                  <circle
                    cx={node.x + 22} cy={node.y + node.height / 2} r={4}
                    fill={node.type === "source" ? "hsl(var(--muted-foreground))" :
                          node.type === "process" ? "hsl(var(--primary))" :
                          node.type === "rule" ? "hsl(40 95% 55%)" :
                          "hsl(var(--primary))"}
                  />
                  {/* Label */}
                  <text x={node.x + 42} y={node.y + (node.sublabel ? node.height / 2 - 5 : node.height / 2 + 4)} fill={colors.text} fontSize="12" fontWeight="600">
                    {node.label.length > 12 ? node.label.slice(0, 12) + "…" : node.label}
                  </text>
                  {/* Sublabel */}
                  {node.sublabel && (
                    <text x={node.x + 42} y={node.y + node.height / 2 + 12} fill="hsl(var(--muted-foreground))" fontSize="10">
                      {node.sublabel}
                    </text>
                  )}
                  {/* Hover glow */}
                  {isHovered && (
                    <rect
                      x={node.x - 2} y={node.y - 2}
                      width={node.width + 4} height={node.height + 4}
                      rx={12}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1}
                      opacity={0.3}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Node detail tooltip */}
          {selectedNode && (() => {
            const node = allNodes.find(n => n.id === selectedNode);
            if (!node) return null;
            const rule = rules.find(r => `rule_${r.id}` === selectedNode);
            return (
              <div
                className="absolute z-10 bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px] text-xs animate-fade-in"
                style={{
                  left: Math.min((node.x + node.width + 12) * scale + offset.x, (containerRef.current?.clientWidth || 600) - 220),
                  top: Math.max(node.y * scale + offset.y, 8),
                }}
              >
                <p className="font-semibold text-foreground text-sm mb-1.5">{node.label}</p>
                {node.sublabel && <p className="text-muted-foreground mb-2">{node.sublabel}</p>}
                {node.meta && Object.entries(node.meta).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-foreground">{v.toLocaleString()}</span>
                  </div>
                ))}
                {rule && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-muted-foreground">{rule.description}</p>
                    <Badge className={`mt-1.5 text-[10px] border ${themeColors[rule.targetTheme] || ""}`}>{rule.targetTheme}</Badge>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-muted/30 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" /> 数据源</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary/60" /> 特征提取</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(40 95% 55% / 0.7)" }} /> 分流规则</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary" /> 洞察主题</div>
          <ChevronRight className="w-3 h-3 ml-auto" />
          <span>悬停节点查看链路 · 点击查看详情</span>
        </div>
      </CardContent>
    </Card>
  );
}
