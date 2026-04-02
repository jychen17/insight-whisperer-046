import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch, ZoomIn, ZoomOut, Maximize2, Database, Filter, GitMerge } from "lucide-react";
import type { ThemeConfig, ConditionNode } from "@/pages/ThemeSettings";

function conditionToText(node: ConditionNode | undefined): string {
  if (!node) return "";
  if (node.type === "condition") {
    const opLabel = node.operator === "equals" ? "=" : node.operator === "not_equals" ? "≠" : node.operator === "contains" ? "∈" : node.operator || "=";
    return `${FIELD_LABELS[node.field || ""] || node.field} ${opLabel} ${node.value}`;
  }
  const childTexts = (node.children || []).map(c => conditionToText(c)).filter(Boolean);
  if (childTexts.length === 0) return "";
  const joined = childTexts.join(` ${node.logic || "AND"} `);
  return childTexts.length > 1 ? `(${joined})` : joined;
}

function hasConditions(node: ConditionNode | undefined): boolean {
  if (!node) return false;
  if (node.type === "condition") return true;
  return (node.children || []).some(c => hasConditions(c));
}

interface FlowNode {
  id: string;
  type: "source" | "rule" | "theme" | "merge";
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

const MERGE_TYPE_LABELS: Record<string, string> = {
  text_similarity: "文本相似合并",
  field_group: "字段分组合并",
  time_window: "时间窗口合并",
  custom: "自定义合并",
};

export default function ThemeFlowCanvas({ theme }: { theme: ThemeConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const nodeW = 170;
  const nodeH = 52;
  const mergeNodes = [...(theme.mergeNodes || [])].filter(n => n.enabled).sort((a, b) => a.order - b.order);
  const hasMerge = mergeNodes.length > 0;

  // Dynamic column positions based on merge node count
  const colGap = 240;
  const colX = [40, 40 + colGap, 40 + colGap * 2];
  // Merge columns come after theme
  const mergeColXs = mergeNodes.map((_, i) => colX[2] + colGap * (i + 1));
  const allColXs = [...colX, ...mergeColXs];
  const canvasW = Math.max(800, (allColXs[allColXs.length - 1] || 560) + nodeW + 80);

  // Source nodes
  const sourceFlowNodes: FlowNode[] = theme.dataSources.map((ds, i) => ({
    id: `src_${ds.taskId}`,
    type: "source",
    label: ds.taskName,
    sublabel: ds.platforms.join("、"),
    x: colX[0], y: 100 + i * 72,
    width: nodeW, height: nodeH,
  }));

  // Rule nodes - per data source
  const ruleFlowNodes: FlowNode[] = [];
  let ruleYOffset = 0;
  theme.dataSources.forEach(ds => {
    const dsConditions = flattenConditions(ds.conditionTree);
    dsConditions.forEach(c => {
      ruleFlowNodes.push({
        id: `rule_${ds.taskId}_${c.id}`,
        type: "rule",
        label: `${FIELD_LABELS[c.field || ""] || c.field} ${c.operator === "equals" ? "=" : c.operator === "not_equals" ? "≠" : "∈"} ${c.value}`,
        sublabel: ds.taskName,
        x: colX[1], y: 100 + ruleYOffset * 72,
        width: nodeW + 20, height: nodeH,
      });
      ruleYOffset++;
    });
  });
  // Fallback: if no per-datasource conditions, use theme-level conditionTree
  if (ruleFlowNodes.length === 0) {
    const flatConditions = flattenConditions(theme.conditionTree);
    flatConditions.forEach((c, i) => {
      ruleFlowNodes.push({
        id: `rule_${c.id}`,
        type: "rule",
        label: `${FIELD_LABELS[c.field || ""] || c.field} ${c.operator === "equals" ? "=" : c.operator === "not_equals" ? "≠" : "∈"} ${c.value}`,
        sublabel: "条件",
        x: colX[1], y: 100 + i * 72,
        width: nodeW + 20, height: nodeH,
      });
    });
  }

  // Theme node
  const maxRows = Math.max(sourceFlowNodes.length, ruleFlowNodes.length, 1);
  const themeNode: FlowNode = {
    id: "theme_dest",
    type: "theme",
    label: theme.name,
    sublabel: `${theme.fieldConfigs.length} 个字段`,
    x: colX[2],
    y: 100 + (maxRows - 1) * 72 / 2,
    width: nodeW, height: 60,
  };

  // Merge pipeline nodes
  const mergeFlowNodes: FlowNode[] = mergeNodes.map((mn, i) => {
    const sublabelParts: string[] = [];
    if (mn.type === "text_similarity" && mn.similarityThreshold) sublabelParts.push(`阈值 ${mn.similarityThreshold}%`);
    if (mn.type === "time_window" && mn.timeWindowHours) sublabelParts.push(`${mn.timeWindowHours}h窗口`);
    if (mn.type === "field_group" && mn.groupByFields?.length) sublabelParts.push(mn.groupByFields.join("+"));
    return {
      id: `merge_${mn.id}`,
      type: "merge" as const,
      label: mn.name || MERGE_TYPE_LABELS[mn.type],
      sublabel: sublabelParts.join(" · ") || MERGE_TYPE_LABELS[mn.type],
      x: mergeColXs[i],
      y: themeNode.y - 2,
      width: nodeW + 10, height: 56,
    };
  });

  const allNodes: FlowNode[] = [...sourceFlowNodes, ...ruleFlowNodes, themeNode, ...mergeFlowNodes];

  // Edges
  const edges: FlowEdge[] = [];
  if (ruleFlowNodes.length > 0) {
    sourceFlowNodes.forEach(s => ruleFlowNodes.forEach(r => edges.push({ from: s.id, to: r.id })));
    ruleFlowNodes.forEach(r => edges.push({ from: r.id, to: themeNode.id }));
  } else {
    sourceFlowNodes.forEach(s => edges.push({ from: s.id, to: themeNode.id }));
  }
  // Theme → first merge, then chain merge nodes
  if (mergeFlowNodes.length > 0) {
    edges.push({ from: themeNode.id, to: mergeFlowNodes[0].id });
    for (let i = 1; i < mergeFlowNodes.length; i++) {
      edges.push({ from: mergeFlowNodes[i - 1].id, to: mergeFlowNodes[i].id });
    }
  }

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
    setScale(s => Math.max(0.3, Math.min(2.5, s + (e.deltaY > 0 ? -0.08 : 0.08))));
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
  const canvasH = maxY + 60;

  // Column headers
  const columnHeaders = [
    { x: colX[0], w: nodeW, label: "数据源", icon: "db" },
    { x: colX[1], w: nodeW + 20, label: "入主题规则", icon: "filter" },
    { x: colX[2], w: nodeW, label: "主题入库", icon: "branch" },
    ...mergeNodes.map((mn, i) => ({
      x: mergeColXs[i], w: nodeW + 10, label: `合并 ${i + 1}`, icon: "merge",
    })),
  ];

  const typeStyles: Record<string, { bg: string; border: string; dot: string }> = {
    source: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", dot: "hsl(var(--muted-foreground))" },
    rule: { bg: "hsl(40 95% 55% / 0.08)", border: "hsl(40 95% 55% / 0.3)", dot: "hsl(40 95% 55%)" },
    theme: { bg: "hsl(var(--primary) / 0.1)", border: "hsl(var(--primary) / 0.4)", dot: "hsl(var(--primary))" },
    merge: { bg: "hsl(var(--info) / 0.1)", border: "hsl(var(--info) / 0.4)", dot: "hsl(var(--info))" },
  };

  const colIconMap: Record<string, JSX.Element> = {
    db: <Database className="w-3 h-3" />,
    filter: <Filter className="w-3 h-3" />,
    branch: <GitBranch className="w-3 h-3" />,
    merge: <GitMerge className="w-3 h-3" />,
  };

  return (
    <Card className={`transition-all ${expanded ? "fixed inset-4 z-50 m-0" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            {theme.icon} {theme.name} · 数据流转全景
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.min(2.5, s + 0.15))}><ZoomIn className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.max(0.3, s - 0.15))}><ZoomOut className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetView}><Maximize2 className="w-3.5 h-3.5" /></Button>
            <Button variant="outline" size="sm" className="h-7 text-xs ml-1" onClick={() => setExpanded(!expanded)}>
              {expanded ? "退出全屏" : "全屏"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          数据源 → 规则 → 入库{hasMerge ? ` → ${mergeNodes.length}级合并` : ""} · 悬停高亮链路 · 缩放 {Math.round(scale * 100)}%
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative overflow-hidden border-t border-border bg-muted/20"
          style={{ height: expanded ? "calc(100vh - 140px)" : Math.min(canvasH * 0.85, 400), cursor: dragging ? "grabbing" : "grab" }}
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
              <marker id="tf-arr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill="hsl(var(--muted-foreground))" opacity="0.4" />
              </marker>
              <marker id="tf-arr-active" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill="hsl(var(--primary))" opacity="0.8" />
              </marker>
              <marker id="tf-arr-merge" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill="hsl(var(--info))" opacity="0.6" />
              </marker>
            </defs>

            {/* Column headers */}
            {columnHeaders.map((col, i) => (
              <g key={i}>
                <rect x={col.x - 6} y={40} width={col.w + 12} height={26} rx={13} fill="hsl(var(--muted))" />
                <text x={col.x + col.w / 2} y={57} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11" fontWeight="500">{col.label}</text>
              </g>
            ))}

            {/* Dashed pipeline connector between theme and merge section */}
            {hasMerge && (
              <line
                x1={colX[2] + nodeW} y1={themeNode.y + themeNode.height / 2}
                x2={mergeColXs[0]} y2={mergeFlowNodes[0].y + mergeFlowNodes[0].height / 2}
                stroke="hsl(var(--info) / 0.25)" strokeWidth="1" strokeDasharray="6 4"
              />
            )}

            {/* Edges */}
            {edges.map((edge, i) => {
              const from = allNodes.find(n => n.id === edge.from);
              const to = allNodes.find(n => n.id === edge.to);
              if (!from || !to) return null;
              const active = highlightedIds && highlightedIds.has(edge.from) && highlightedIds.has(edge.to);
              const dimmed = highlightedIds && !active;
              const isMergeEdge = from.type === "merge" || to.type === "merge";
              const markerEnd = active ? "url(#tf-arr-active)" : isMergeEdge ? "url(#tf-arr-merge)" : "url(#tf-arr)";
              return (
                <path
                  key={i}
                  d={getEdgePath(from, to)}
                  fill="none"
                  stroke={active ? "hsl(var(--primary))" : isMergeEdge ? "hsl(var(--info) / 0.5)" : "hsl(var(--border))"}
                  strokeWidth={active ? 2 : 1.2}
                  opacity={dimmed ? 0.1 : active ? 1 : 0.5}
                  markerEnd={markerEnd}
                  className="transition-all duration-200"
                />
              );
            })}

            {/* Order badges on merge chain edges */}
            {mergeFlowNodes.map((mn, i) => {
              const prevNode = i === 0 ? themeNode : mergeFlowNodes[i - 1];
              const midX = (prevNode.x + prevNode.width + mn.x) / 2;
              const midY = (prevNode.y + prevNode.height / 2 + mn.y + mn.height / 2) / 2;
              return (
                <g key={`badge_${mn.id}`}>
                  <circle cx={midX} cy={midY} r={10} fill="hsl(var(--info))" />
                  <text x={midX} y={midY + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="700">{i + 1}</text>
                </g>
              );
            })}

            {/* Nodes */}
            {allNodes.map(node => {
              const st = typeStyles[node.type] || typeStyles.source;
              const dimmed = highlightedIds && !highlightedIds.has(node.id);
              const active = highlightedIds?.has(node.id);
              const hovered = hoveredNode === node.id;
              const isTheme = node.type === "theme";
              const isMerge = node.type === "merge";
              const rx = isTheme ? 12 : isMerge ? 10 : 8;

              return (
                <g
                  key={node.id}
                  style={{ opacity: dimmed ? 0.15 : 1 }}
                  className="cursor-pointer transition-opacity duration-200"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Shadow */}
                  <rect x={node.x + 1} y={node.y + 1} width={node.width} height={node.height} rx={rx} fill="hsl(var(--foreground) / 0.04)" />
                  {/* Body */}
                  <rect
                    x={node.x} y={node.y} width={node.width} height={node.height} rx={rx}
                    fill={st.bg}
                    stroke={active || hovered ? "hsl(var(--primary))" : st.border}
                    strokeWidth={active || hovered ? 2 : isTheme || isMerge ? 1.5 : 1}
                  />
                  {/* Merge icon area */}
                  {isMerge && (
                    <>
                      <rect x={node.x} y={node.y} width={28} height={node.height} rx={rx} fill="hsl(var(--info) / 0.15)" />
                      <text x={node.x + 14} y={node.y + node.height / 2 + 5} textAnchor="middle" fill="hsl(var(--info))" fontSize="14">⇄</text>
                    </>
                  )}
                  {/* Theme icon */}
                  {isTheme && (
                    <text x={node.x + node.width / 2} y={node.y + 16} textAnchor="middle" fill="hsl(var(--primary))" fontSize="16">{theme.icon}</text>
                  )}
                  {/* Source dot */}
                  {!isTheme && !isMerge && <circle cx={node.x + 18} cy={node.y + node.height / 2} r={5} fill={st.dot} opacity={0.7} />}
                  {/* Label */}
                  <text
                    x={isMerge ? node.x + 34 : isTheme ? node.x + node.width / 2 : node.x + 30}
                    y={node.y + (node.sublabel ? (isTheme ? node.height / 2 + 2 : node.height / 2 - 4) : node.height / 2 + 4)}
                    textAnchor={isTheme ? "middle" : "start"}
                    fill="hsl(var(--foreground))" fontSize={isTheme ? "12" : "11"} fontWeight="600"
                  >
                    {node.label.length > 14 ? node.label.slice(0, 14) + "…" : node.label}
                  </text>
                  {/* Sublabel */}
                  {node.sublabel && (
                    <text
                      x={isMerge ? node.x + 34 : isTheme ? node.x + node.width / 2 : node.x + 30}
                      y={node.y + (isTheme ? node.height / 2 + 16 : node.height / 2 + 11)}
                      textAnchor={isTheme ? "middle" : "start"}
                      fill="hsl(var(--muted-foreground))" fontSize="9"
                    >
                      {node.sublabel.length > 18 ? node.sublabel.slice(0, 18) + "…" : node.sublabel}
                    </text>
                  )}
                  {/* Hover ring */}
                  {hovered && (
                    <rect x={node.x - 2} y={node.y - 2} width={node.width + 4} height={node.height + 4} rx={rx + 2} fill="none" stroke="hsl(var(--primary))" strokeWidth={1} opacity={0.3} />
                  )}
                </g>
              );
            })}

            {/* Legend */}
            <g transform={`translate(${canvasW - 200}, ${canvasH - 50})`}>
              {[
                { color: "hsl(var(--muted-foreground))", label: "数据源" },
                { color: "hsl(40 95% 55%)", label: "规则" },
                { color: "hsl(var(--primary))", label: "主题" },
                ...(hasMerge ? [{ color: "hsl(var(--info))", label: "合并" }] : []),
              ].map((item, i) => (
                <g key={i} transform={`translate(${i * 52}, 0)`}>
                  <circle cx={6} cy={6} r={4} fill={item.color} opacity={0.7} />
                  <text x={14} y={10} fill="hsl(var(--muted-foreground))" fontSize="9">{item.label}</text>
                </g>
              ))}
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
