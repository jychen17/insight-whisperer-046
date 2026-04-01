import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch, ZoomIn, ZoomOut, Maximize2, Database, Filter } from "lucide-react";
import type { ThemeConfig, ConditionNode } from "@/pages/ThemeSettings";

function flattenConditions(node: ConditionNode | undefined): ConditionNode[] {
  if (!node) return [];
  if (node.type === "condition") return [node];
  return (node.children || []).flatMap(c => flattenConditions(c));
}

interface FlowNode {
  id: string;
  type: "source" | "rule" | "theme";
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FlowEdge {
  from: string;
  to: string;
}

const FIELD_LABELS: Record<string, string> = {
  sentiment: "情感倾向", risk_level: "风险等级", topic: "话题分类", intent: "用户意图",
  platform: "平台", publish_time: "发布时间", author: "作者", content: "内容正文",
  likes: "点赞数", comments: "评论数", shares: "分享数", reads: "阅读数",
};

export default function ThemeFlowCanvas({ theme }: { theme: ThemeConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const nodeW = 180;
  const nodeH = 52;

  // Column positions
  const colX = [40, 300, 560];

  // Source nodes (collection tasks)
  const sourceNodes: FlowNode[] = theme.dataSources.map((ds, i) => ({
    id: `src_${ds.taskId}`,
    type: "source",
    label: ds.taskName,
    sublabel: ds.platforms.join("、"),
    x: colX[0], y: 100 + i * 76,
    width: nodeW, height: nodeH,
  }));

  // Rule nodes from condition tree
  const flatConditions = flattenConditions(theme.conditionTree);
  const ruleNodes: FlowNode[] = flatConditions.map((c, i) => ({
    id: `rule_${c.id}`,
    type: "rule",
    label: `${FIELD_LABELS[c.field || ""] || c.field} ${c.operator === "equals" ? "=" : c.operator === "not_equals" ? "≠" : "∈"} ${c.value}`,
    sublabel: "条件",
    x: colX[1], y: 100 + i * 76,
    width: nodeW + 20, height: nodeH,
  }));

  // Theme node (single destination)
  const themeNode: FlowNode = {
    id: "theme_dest",
    type: "theme",
    label: theme.name,
    sublabel: `${theme.baseFields.length + theme.calcFields.length} 个展示字段`,
    x: colX[2],
    y: 100 + Math.max(0, (Math.max(sourceNodes.length, ruleNodes.length) - 1) * 76) / 2,
    width: nodeW, height: 64,
  };

  const allNodes = [...sourceNodes, ...ruleNodes, themeNode];

  // Build edges: sources → rules → theme
  const edges: FlowEdge[] = [];
  sourceNodes.forEach(s => ruleNodes.forEach(r => edges.push({ from: s.id, to: r.id })));
  ruleNodes.forEach(r => edges.push({ from: r.id, to: themeNode.id }));

  // Highlight connected
  const getConnectedIds = (nodeId: string) => {
    const connected = new Set<string>([nodeId]);
    const traverse = (id: string, dir: "f" | "b") => {
      edges.forEach(e => {
        if (dir === "f" && e.from === id && !connected.has(e.to)) { connected.add(e.to); traverse(e.to, "f"); }
        if (dir === "b" && e.to === id && !connected.has(e.from)) { connected.add(e.from); traverse(e.from, "b"); }
      });
    };
    traverse(nodeId, "f");
    traverse(nodeId, "b");
    return connected;
  };
  const highlightedIds = hoveredNode ? getConnectedIds(hoveredNode) : null;

  const getEdgePath = (from: FlowNode, to: FlowNode) => {
    const x1 = from.x + from.width;
    const y1 = from.y + from.height / 2;
    const x2 = to.x;
    const y2 = to.y + to.height / 2;
    const cx = (x1 + x2) / 2;
    return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.max(0.4, Math.min(2, s + (e.deltaY > 0 ? -0.08 : 0.08))));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "svg" || ((e.target as HTMLElement).getAttribute("data-bg") === "true")) {
      setDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => { if (dragging) setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => setDragging(false);
  const resetView = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  const maxY = Math.max(...allNodes.map(n => n.y + n.height), 300);
  const canvasW = 800;
  const canvasH = maxY + 60;

  const columnHeaders = [
    { x: colX[0], w: nodeW, label: "数据源", icon: <Database className="w-3 h-3" /> },
    { x: colX[1], w: nodeW + 20, label: "入主题规则", icon: <Filter className="w-3 h-3" /> },
    { x: colX[2], w: nodeW, label: "主题", icon: <GitBranch className="w-3 h-3" /> },
  ];

  const typeStyles: Record<string, { bg: string; border: string; dot: string }> = {
    source: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", dot: "hsl(var(--muted-foreground))" },
    rule: { bg: "hsl(40 95% 55% / 0.08)", border: "hsl(40 95% 55% / 0.3)", dot: "hsl(40 95% 55%)" },
    theme: { bg: "hsl(var(--primary) / 0.1)", border: "hsl(var(--primary) / 0.4)", dot: "hsl(var(--primary))" },
  };

  return (
    <Card className={`transition-all ${expanded ? "fixed inset-4 z-50 m-0" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            {theme.icon} {theme.name} · 数据入主题决策流
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.min(2, s + 0.15))}><ZoomIn className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.max(0.4, s - 0.15))}><ZoomOut className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetView}><Maximize2 className="w-3.5 h-3.5" /></Button>
            <Button variant="outline" size="sm" className="h-7 text-xs ml-1" onClick={() => setExpanded(!expanded)}>
              {expanded ? "退出全屏" : "全屏"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">数据源 → 入主题规则 → 主题 · 悬停高亮链路 · 缩放 {Math.round(scale * 100)}%</p>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative overflow-hidden border-t border-border bg-muted/20"
          style={{ height: expanded ? "calc(100vh - 140px)" : Math.min(canvasH * 0.85, 360), cursor: dragging ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
            <defs>
              <pattern id="themeGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#themeGrid)" />
          </svg>

          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${canvasW} ${canvasH}`}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: "center" }}
          >
            <defs>
              <marker id="arr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill="hsl(var(--muted-foreground))" opacity="0.4" />
              </marker>
              <marker id="arr-active" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill="hsl(var(--primary))" opacity="0.8" />
              </marker>
            </defs>

            {/* Column headers */}
            {columnHeaders.map((col, i) => (
              <g key={i}>
                <rect x={col.x - 6} y={40} width={col.w + 12} height={26} rx={13} fill="hsl(var(--muted))" />
                <text x={col.x + col.w / 2} y={57} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11" fontWeight="500">{col.label}</text>
              </g>
            ))}

            {/* Edges */}
            {edges.map((edge, i) => {
              const from = allNodes.find(n => n.id === edge.from);
              const to = allNodes.find(n => n.id === edge.to);
              if (!from || !to) return null;
              const active = highlightedIds && highlightedIds.has(edge.from) && highlightedIds.has(edge.to);
              const dimmed = highlightedIds && !active;
              return (
                <path
                  key={i}
                  d={getEdgePath(from, to)}
                  fill="none"
                  stroke={active ? "hsl(var(--primary))" : "hsl(var(--border))"}
                  strokeWidth={active ? 2 : 1}
                  opacity={dimmed ? 0.1 : active ? 1 : 0.4}
                  markerEnd={active ? "url(#arr-active)" : "url(#arr)"}
                  className="transition-all duration-200"
                />
              );
            })}

            {/* Nodes */}
            {allNodes.map(node => {
              const st = typeStyles[node.type] || typeStyles.source;
              const dimmed = highlightedIds && !highlightedIds.has(node.id);
              const active = highlightedIds?.has(node.id);
              const hovered = hoveredNode === node.id;
              const isTheme = node.type === "theme";

              return (
                <g
                  key={node.id}
                  style={{ opacity: dimmed ? 0.15 : 1 }}
                  className="cursor-pointer transition-opacity duration-200"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <rect x={node.x + 1} y={node.y + 1} width={node.width} height={node.height} rx={isTheme ? 12 : 8} fill="hsl(var(--foreground) / 0.04)" />
                  <rect
                    x={node.x} y={node.y} width={node.width} height={node.height} rx={isTheme ? 12 : 8}
                    fill={st.bg}
                    stroke={active || hovered ? "hsl(var(--primary))" : st.border}
                    strokeWidth={active || hovered ? 2 : isTheme ? 2 : 1}
                  />
                  {isTheme && (
                    <text x={node.x + node.width / 2} y={node.y + 16} textAnchor="middle" fill="hsl(var(--primary))" fontSize="16">{theme.icon}</text>
                  )}
                  {!isTheme && <circle cx={node.x + 18} cy={node.y + node.height / 2} r={5} fill={st.dot} opacity={0.7} />}
                  <text
                    x={isTheme ? node.x + node.width / 2 : node.x + 30}
                    y={node.y + (node.sublabel ? (isTheme ? node.height / 2 + 4 : node.height / 2 - 4) : node.height / 2 + 4)}
                    textAnchor={isTheme ? "middle" : "start"}
                    fill="hsl(var(--foreground))" fontSize={isTheme ? "12" : "11"} fontWeight="600"
                  >
                    {node.label.length > 16 ? node.label.slice(0, 16) + "…" : node.label}
                  </text>
                  {node.sublabel && (
                    <text
                      x={isTheme ? node.x + node.width / 2 : node.x + 30}
                      y={node.y + (isTheme ? node.height / 2 + 18 : node.height / 2 + 11)}
                      textAnchor={isTheme ? "middle" : "start"}
                      fill="hsl(var(--muted-foreground))" fontSize="9"
                    >
                      {node.sublabel.length > 20 ? node.sublabel.slice(0, 20) + "…" : node.sublabel}
                    </text>
                  )}
                  {hovered && (
                    <rect x={node.x - 2} y={node.y - 2} width={node.width + 4} height={node.height + 4} rx={isTheme ? 14 : 10} fill="none" stroke="hsl(var(--primary))" strokeWidth={1} opacity={0.3} />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
