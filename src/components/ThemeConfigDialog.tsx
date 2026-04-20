import { useState, useEffect } from "react";
import { X, Plus, Trash2, GripVertical, GitMerge, ArrowUp, ArrowDown, Search, ChevronDown, ChevronRight, Check, Copy, Calendar } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type {
  ThemeConfig,
  DataSourceConfig,
  DashboardWidget,
  FieldConfig,
  MergeNode,
  MergeDisplayField,
  MergeCondition,
  MergeConditionNode,
  ConditionNode,
  TaskParamConfig,
  ExtendedParamConfig,
} from "@/pages/ThemeSettings";
import { ALL_FIELDS } from "@/pages/ThemeSettings";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SortableList } from "@/components/SortableFieldList";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: ThemeConfig | null;
  onSave: (theme: ThemeConfig) => void;
  /** Optional: jump directly to a step (0-indexed) when the dialog opens */
  initialStep?: number;
  /** Optional: auto-expand a specific data source's edit panel on open */
  initialDataSourceId?: string;
}

const TASK_TYPES = ["话题", "账号", "关键词", "链接"];
// 发布平台：覆盖主流社媒、资讯、电商、投诉、视频、垂类等几十个平台
const PLATFORM_OPTIONS = [
  "新浪微博", "微信公众号", "微信视频号", "小红书", "抖音", "抖音极速版", "快手", "快手极速版",
  "B站", "知乎", "百度", "百度贴吧", "百度知道", "今日头条", "西瓜视频", "腾讯新闻", "网易新闻",
  "凤凰新闻", "搜狐新闻", "新浪新闻", "界面新闻", "36氪", "虎嗅", "钛媒体", "雪球", "脉脉",
  "豆瓣", "天涯", "猫扑", "黑猫投诉", "消费保", "聚投诉", "12315", "京东", "淘宝", "天猫",
  "拼多多", "苏宁易购", "唯品会", "携程", "去哪儿", "马蜂窝", "飞猪", "美团", "大众点评",
  "Twitter", "Facebook", "Instagram", "YouTube", "TikTok", "LinkedIn", "Reddit",
];
const SORT_OPTIONS = ["默认排序", "时间倒序", "热度排序", "相关度排序"];
const OWNER_OPTIONS = ["张三", "李四", "王五", "赵六", "陈佳燕-1227152"];
const BRAND_OPTIONS = ["同程旅行", "万达酒店", "同程金服", "携程", "飞猪", "美团"];

const OPERATORS = [
  { value: "equals", label: "等于" },
  { value: "not_equals", label: "不等于" },
  { value: "contains", label: "包含" },
  { value: "not_contains", label: "不包含" },
  { value: "greater", label: "大于" },
  { value: "less", label: "小于" },
];

const MERGE_CONDITION_OPERATORS = [
  { value: "similarity_gte", label: "相似度 ≥ (%)" },
  { value: "time_within", label: "时间窗口内 (小时)" },
  { value: "equals", label: "字段值相同" },
  { value: "contains", label: "字段值包含" },
];

const ICONS = ["🛡️", "🌐", "⚡", "💡", "🔥", "📡", "🎯", "🧭", "📊", "💬", "🔍", "🏷️"];

const FIELD_TYPE_LABELS: Record<string, string> = { ai: "AI标签", raw: "原生字段", calc: "计算字段" };

const emptyConditionTree: ConditionNode = { id: "root", type: "group", logic: "AND", children: [] };

const emptyTheme: ThemeConfig = {
  id: "", name: "", description: "", owner: "", type: "custom", status: "active", icon: "🎯",
  dataSources: [], conditionTree: { ...emptyConditionTree }, fieldConfigs: [], mergeNodes: [], dashboardWidgets: [],
  createdAt: "", updatedAt: "",
};

export default function ThemeConfigDialog({ open, onOpenChange, theme, onSave, initialStep, initialDataSourceId }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ThemeConfig>(emptyTheme);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dsSearch, setDsSearch] = useState("");
  const [fieldSearch, setFieldSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [activeConditionDS, setActiveConditionDS] = useState<string>("");
  const [mergeFieldSearch, setMergeFieldSearch] = useState("");
  const [editingDS, setEditingDS] = useState<string | null>(null);
  const [topicInput, setTopicInput] = useState<Record<string, string>>({});
  const [platformSearch, setPlatformSearch] = useState<Record<string, string>>({});

  const isEdit = !!theme;
  const steps = ["基本信息", "数据源", "入主题条件", "字段配置", "合并管线"];

  useEffect(() => {
    if (open) {
      const stepCount = 5;
      setStep(typeof initialStep === "number" ? Math.max(0, Math.min(initialStep, stepCount - 1)) : 0);
      setErrors({}); setDsSearch(""); setFieldSearch("");
      setCollapsedGroups({}); setActiveConditionDS("");
      const initForm = theme ? {
        ...theme,
        mergeNodes: Array.isArray(theme.mergeNodes) ? theme.mergeNodes : [],
        conditionTree: theme.conditionTree || { ...emptyConditionTree },
        fieldConfigs: Array.isArray(theme.fieldConfigs) ? theme.fieldConfigs : [],
        dataSources: (theme.dataSources || []).map(ds => ({
          ...ds,
          conditionTree: ds.conditionTree || { ...emptyConditionTree },
          includeWords: Array.isArray(ds.includeWords) ? ds.includeWords : [],
          excludeWords: Array.isArray(ds.excludeWords) ? ds.excludeWords : [],
        })),
      } : { ...emptyTheme, id: `custom_${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) };
      setForm(initForm);
      if (initForm.dataSources.length > 0) {
        setActiveConditionDS(initForm.dataSources[0].taskId);
      }
      // Auto-expand a specific data source's edit panel when navigated from CollectionTasks
      if (initialDataSourceId && initForm.dataSources.find(ds => ds.taskId === initialDataSourceId)) {
        setEditingDS(initialDataSourceId);
      } else {
        setEditingDS(null);
      }
    }
  }, [open, theme, initialStep, initialDataSourceId]);

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = "请输入主题名称";
      if (!form.description.trim()) e.description = "请输入主题描述";
      if (!form.owner.trim()) e.owner = "请输入负责人";
    }
    if (s === 1 && form.dataSources.length === 0) e.dataSources = "请至少选择一个采集任务";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep(step)) setStep(s => Math.min(s + 1, steps.length - 1)); };
  const handlePrev = () => setStep(s => Math.max(s - 1, 0));
  const handleSave = () => { if (validateStep(step)) onSave({ ...form, updatedAt: new Date().toISOString().slice(0, 10) }); };

  // ── Data Sources ──
  const addDataSource = () => {
    const id = `ds_t${Date.now()}`;
    const newDs: DataSourceConfig = {
      taskId: id, taskName: "", taskType: "话题", owner: "",
      executionPeriodStart: new Date().toISOString().slice(0, 10),
      executionPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      scheduleMode: "interval", scheduleTimeStart: 0, scheduleTimeEnd: 23, intervalHours: 6,
      taskParams: [{ platforms: [], topics: [] }],
      extendedParams: [{ platform: "" }],
      platforms: [], timeRange: "近7天", enabled: true,
      conditionTree: { ...emptyConditionTree, id: `root_${id}` },
      includeWords: [], excludeWords: [],
    };
    setForm(f => {
      if (f.dataSources.length === 0) setActiveConditionDS(id);
      return { ...f, dataSources: [...f.dataSources, newDs] };
    });
    setEditingDS(id);
  };

  const removeDataSource = (taskId: string) => {
    setForm(f => {
      const newDS = f.dataSources.filter(ds => ds.taskId !== taskId);
      if (activeConditionDS === taskId && newDS.length > 0) setActiveConditionDS(newDS[0].taskId);
      return { ...f, dataSources: newDS };
    });
    if (editingDS === taskId) setEditingDS(null);
  };

  const updateDataSource = (taskId: string, update: Partial<DataSourceConfig>) => {
    setForm(f => ({
      ...f,
      dataSources: f.dataSources.map(ds => {
        if (ds.taskId !== taskId) return ds;
        const updated = { ...ds, ...update };
        // Normalize taskParams: ensure platforms is always an array
        updated.taskParams = updated.taskParams.map(tp => ({
          ...tp,
          platforms: Array.isArray(tp.platforms) ? tp.platforms : ((tp as any).platform ? [(tp as any).platform] : []),
        }));
        // Derive platforms from taskParams
        updated.platforms = [...new Set(updated.taskParams.flatMap(tp => tp.platforms).filter(Boolean))];
        return updated;
      }),
    }));
  };

  const addTaskParam = (taskId: string) => {
    const ds = form.dataSources.find(d => d.taskId === taskId);
    if (!ds) return;
    updateDataSource(taskId, { taskParams: [...ds.taskParams, { platforms: [], topics: [] }] });
  };

  const updateTaskParam = (taskId: string, idx: number, update: Partial<TaskParamConfig>) => {
    const ds = form.dataSources.find(d => d.taskId === taskId);
    if (!ds) return;
    updateDataSource(taskId, { taskParams: ds.taskParams.map((tp, i) => i === idx ? { ...tp, ...update } : tp) });
  };

  const removeTaskParam = (taskId: string, idx: number) => {
    const ds = form.dataSources.find(d => d.taskId === taskId);
    if (!ds || ds.taskParams.length <= 1) return;
    updateDataSource(taskId, { taskParams: ds.taskParams.filter((_, i) => i !== idx) });
  };

  const addExtendedParam = (taskId: string) => {
    const ds = form.dataSources.find(d => d.taskId === taskId);
    if (!ds) return;
    updateDataSource(taskId, { extendedParams: [...ds.extendedParams, { platform: "" }] });
  };

  const updateExtendedParam = (taskId: string, idx: number, update: Partial<ExtendedParamConfig>) => {
    const ds = form.dataSources.find(d => d.taskId === taskId);
    if (!ds) return;
    updateDataSource(taskId, { extendedParams: ds.extendedParams.map((ep, i) => i === idx ? { ...ep, ...update } : ep) });
  };

  const removeExtendedParam = (taskId: string, idx: number) => {
    const ds = form.dataSources.find(d => d.taskId === taskId);
    if (!ds || ds.extendedParams.length <= 1) return;
    updateDataSource(taskId, { extendedParams: ds.extendedParams.filter((_, i) => i !== idx) });
  };

  // ── Condition Tree (per data source) ──
  const updateDSConditionTree = (taskId: string, tree: ConditionNode) => {
    setForm(f => ({
      ...f,
      dataSources: f.dataSources.map(ds => ds.taskId === taskId ? { ...ds, conditionTree: tree } : ds),
    }));
  };

  const getActiveDS = () => form.dataSources.find(ds => ds.taskId === activeConditionDS);
  const getActiveDSTree = () => getActiveDS()?.conditionTree || emptyConditionTree;

  const addCondition = (parentId: string) => {
    const newCond: ConditionNode = { id: `c_${Date.now()}`, type: "condition", field: "", operator: "equals", value: "" };
    updateDSConditionTree(activeConditionDS, insertIntoTree(getActiveDSTree(), parentId, newCond));
  };
  const addGroup = (parentId: string) => {
    const newGroup: ConditionNode = { id: `g_${Date.now()}`, type: "group", logic: "AND", children: [] };
    updateDSConditionTree(activeConditionDS, insertIntoTree(getActiveDSTree(), parentId, newGroup));
  };
  const removeConditionNode = (nodeId: string) => {
    updateDSConditionTree(activeConditionDS, removeFromTree(getActiveDSTree(), nodeId));
  };
  const updateConditionNode = (nodeId: string, update: Partial<ConditionNode>) => {
    updateDSConditionTree(activeConditionDS, updateInTree(getActiveDSTree(), nodeId, update));
  };

  // ── Fields ──
  const toggleField = (key: string) => {
    setForm(f => {
      const exists = f.fieldConfigs.find(fc => fc.key === key);
      if (exists) return { ...f, fieldConfigs: f.fieldConfigs.filter(fc => fc.key !== key) };
      const fieldDef = ALL_FIELDS.find(ff => ff.key === key);
      if (!fieldDef) return f;
      const newFc: FieldConfig = {
        key, fieldType: fieldDef.fieldType, displayPosition: "both",
        isFilter: false, filterType: fieldDef.hasSystemEnum ? "enum" : "text",
        hasSystemEnum: fieldDef.hasSystemEnum, enumValues: fieldDef.enumValues || [],
      };
      return { ...f, fieldConfigs: [...f.fieldConfigs, newFc] };
    });
  };
  const updateFieldConfig = (key: string, update: Partial<FieldConfig>) => {
    setForm(f => {
      let configs = f.fieldConfigs.map(fc => fc.key === key ? { ...fc, ...update } : fc);
      // If setting isDefaultSort, clear others
      if (update.isDefaultSort) {
        configs = configs.map(fc => fc.key === key ? fc : { ...fc, isDefaultSort: false });
      }
      return { ...f, fieldConfigs: configs };
    });
  };

  // ── Merge Nodes ──
  const addMergeNode = () => {
    const nodes = form.mergeNodes || [];
    const maxOrder = nodes.length > 0 ? Math.max(...nodes.map(n => n.order)) : 0;
    setForm(f => ({
      ...f, mergeNodes: [...(f.mergeNodes || []), {
        id: `mn_${Date.now()}`, name: `合并节点${(f.mergeNodes || []).length + 1}`, enabled: true,
        mergeConditions: [], mergeConditionTree: { id: `mct_${Date.now()}`, type: "group" as const, logic: "AND" as const, children: [] },
        order: maxOrder + 1, displayFields: [],
      }],
    }));
  };
  const updateMergeNode = (id: string, update: Partial<MergeNode>) => {
    setForm(f => ({ ...f, mergeNodes: (f.mergeNodes || []).map(n => n.id === id ? { ...n, ...update } : n) }));
  };
  const removeMergeNode = (id: string) => {
    setForm(f => { const filtered = (f.mergeNodes || []).filter(n => n.id !== id); return { ...f, mergeNodes: filtered.map((n, i) => ({ ...n, order: i + 1 })) }; });
  };
  const moveMergeNode = (id: string, dir: "up" | "down") => {
    setForm(f => {
      const sorted = [...(f.mergeNodes || [])].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(n => n.id === id);
      if ((dir === "up" && idx <= 0) || (dir === "down" && idx >= sorted.length - 1)) return f;
      const si = dir === "up" ? idx - 1 : idx + 1;
      const t = sorted[idx].order; sorted[idx] = { ...sorted[idx], order: sorted[si].order }; sorted[si] = { ...sorted[si], order: t };
      return { ...f, mergeNodes: sorted };
    });
  };

  // ── Merge Condition Tree ──
  const updateMergeConditionTree = (nodeId: string, tree: MergeConditionNode) => {
    setForm(f => ({
      ...f, mergeNodes: (f.mergeNodes || []).map(n => n.id === nodeId ? { ...n, mergeConditionTree: tree } : n),
    }));
  };
  const addMergeTreeCondition = (mergeNodeId: string, parentId: string) => {
    const node = (form.mergeNodes || []).find(n => n.id === mergeNodeId);
    if (!node?.mergeConditionTree) return;
    const newCond: MergeConditionNode = { id: `mc_${Date.now()}`, type: "condition", field: "", operator: "equals", value: "" };
    updateMergeConditionTree(mergeNodeId, insertIntoMergeTree(node.mergeConditionTree, parentId, newCond));
  };
  const addMergeTreeGroup = (mergeNodeId: string, parentId: string) => {
    const node = (form.mergeNodes || []).find(n => n.id === mergeNodeId);
    if (!node?.mergeConditionTree) return;
    const newGroup: MergeConditionNode = { id: `mg_${Date.now()}`, type: "group", logic: "AND", children: [] };
    updateMergeConditionTree(mergeNodeId, insertIntoMergeTree(node.mergeConditionTree, parentId, newGroup));
  };
  const removeMergeTreeNode = (mergeNodeId: string, nodeToRemoveId: string) => {
    const node = (form.mergeNodes || []).find(n => n.id === mergeNodeId);
    if (!node?.mergeConditionTree) return;
    updateMergeConditionTree(mergeNodeId, removeFromMergeTree(node.mergeConditionTree, nodeToRemoveId));
  };
  const updateMergeTreeNode = (mergeNodeId: string, nodeToUpdateId: string, update: Partial<MergeConditionNode>) => {
    const node = (form.mergeNodes || []).find(n => n.id === mergeNodeId);
    if (!node?.mergeConditionTree) return;
    updateMergeConditionTree(mergeNodeId, updateInMergeTree(node.mergeConditionTree, nodeToUpdateId, update));
  };

  // Legacy flat merge conditions (kept for backward compat)
  const addMergeCondition = (nodeId: string) => {
    setForm(f => ({
      ...f, mergeNodes: (f.mergeNodes || []).map(n => {
        if (n.id !== nodeId) return n;
        return { ...n, mergeConditions: [...n.mergeConditions, { id: `mc_${Date.now()}`, field: "", operator: "equals" as const, value: "" }] };
      }),
    }));
  };
  const updateMergeCondition = (nodeId: string, condId: string, update: Partial<MergeCondition>) => {
    setForm(f => ({
      ...f, mergeNodes: (f.mergeNodes || []).map(n => {
        if (n.id !== nodeId) return n;
        return { ...n, mergeConditions: n.mergeConditions.map(mc => mc.id === condId ? { ...mc, ...update } : mc) };
      }),
    }));
  };
  const removeMergeCondition = (nodeId: string, condId: string) => {
    setForm(f => ({
      ...f, mergeNodes: (f.mergeNodes || []).map(n => {
        if (n.id !== nodeId) return n;
        return { ...n, mergeConditions: n.mergeConditions.filter(mc => mc.id !== condId) };
      }),
    }));
  };

  const toggleMergeDisplayField = (nodeId: string, fieldKey: string) => {
    setForm(f => ({
      ...f, mergeNodes: (f.mergeNodes || []).map(n => {
        if (n.id !== nodeId) return n;
        const dfs = n.displayFields || [];
        const exists = dfs.find(d => d.key === fieldKey);
        if (exists) return { ...n, displayFields: dfs.filter(d => d.key !== fieldKey) };
        const fieldDef = ALL_FIELDS.find(ff => ff.key === fieldKey);
        const fieldType = fieldDef?.fieldType || "raw";
        return { ...n, displayFields: [...dfs, { key: fieldKey, fieldType: fieldType as MergeDisplayField["fieldType"], position: "list" as const, hasSystemEnum: fieldDef?.hasSystemEnum, enumValues: fieldDef?.enumValues }] };
      }),
    }));
  };
  const updateMergeDisplayField = (nodeId: string, fieldKey: string, update: Partial<MergeDisplayField>) => {
    setForm(f => ({
      ...f, mergeNodes: (f.mergeNodes || []).map(n => {
        if (n.id !== nodeId) return n;
        let dfs = (n.displayFields || []).map(d => d.key === fieldKey ? { ...d, ...update } : d);
        if (update.isDefaultSort) {
          dfs = dfs.map(d => d.key === fieldKey ? d : { ...d, isDefaultSort: false });
        }
        return { ...n, displayFields: dfs };
      }),
    }));
  };

  // Select all fields for a type in merge display fields
  const toggleAllMergeDisplayFields = (nodeId: string, fieldType: "ai" | "raw" | "calc", select: boolean) => {
    const fieldsOfType = ALL_FIELDS.filter(f => f.fieldType === fieldType);
    setForm(f => ({
      ...f, mergeNodes: (f.mergeNodes || []).map(n => {
        if (n.id !== nodeId) return n;
        let dfs = n.displayFields || [];
        if (select) {
          fieldsOfType.forEach(ff => {
            if (!dfs.find(d => d.key === ff.key)) {
              dfs = [...dfs, { key: ff.key, fieldType: ff.fieldType as MergeDisplayField["fieldType"], position: "list" as const, hasSystemEnum: ff.hasSystemEnum, enumValues: ff.enumValues }];
            }
          });
        } else {
          dfs = dfs.filter(d => !fieldsOfType.find(ff => ff.key === d.key));
        }
        return { ...n, displayFields: dfs };
      }),
    }));
  };

  // Select all fields for a type in step 3
  const toggleAllFields = (fieldType: "ai" | "raw" | "calc", select: boolean) => {
    const fieldsOfType = ALL_FIELDS.filter(f => f.fieldType === fieldType);
    setForm(f => {
      let configs = [...f.fieldConfigs];
      if (select) {
        fieldsOfType.forEach(ff => {
          if (!configs.find(c => c.key === ff.key)) {
            configs.push({
              key: ff.key, fieldType: ff.fieldType, displayPosition: "both",
              isFilter: false, filterType: ff.hasSystemEnum ? "enum" : "text",
              hasSystemEnum: ff.hasSystemEnum, enumValues: ff.enumValues || [],
            });
          }
        });
      } else {
        configs = configs.filter(c => !fieldsOfType.find(ff => ff.key === c.key));
      }
      return { ...f, fieldConfigs: configs };
    });
  };

  // Toggle platform in multi-select for task params
  const toggleTaskParamPlatform = (taskId: string, tpIdx: number, platform: string) => {
    const ds = form.dataSources.find(d => d.taskId === taskId);
    if (!ds) return;
    const tp = ds.taskParams[tpIdx];
    const currentPlatforms = Array.isArray(tp.platforms) ? tp.platforms : ((tp as any).platform ? [(tp as any).platform] : []);
    const platforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter(p => p !== platform)
      : [...currentPlatforms, platform];
    updateTaskParam(taskId, tpIdx, { platforms });
  };

  if (!open) return null;

  const sortedMergeNodes = [...(form.mergeNodes || [])].sort((a, b) => a.order - b.order);

  const fieldsByType = { ai: ALL_FIELDS.filter(f => f.fieldType === "ai"), raw: ALL_FIELDS.filter(f => f.fieldType === "raw"), calc: ALL_FIELDS.filter(f => f.fieldType === "calc") };
  const filteredFields = (fields: typeof ALL_FIELDS) => fields.filter(f => !fieldSearch || f.label.includes(fieldSearch) || f.key.includes(fieldSearch));

  const toggleGroup = (g: string) => setCollapsedGroups(prev => ({ ...prev, [g]: !prev[g] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-[900px] max-h-[88vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">{isEdit ? "编辑主题" : "新建主题"}</h2>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-border shrink-0">
          {steps.map((s, i) => (
            <button key={s} onClick={() => { if (i < step || validateStep(step)) setStep(i); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                i === step ? "gradient-primary text-primary-foreground font-medium" : i < step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i === step ? "bg-primary-foreground/20" : i < step ? "bg-primary/20" : "bg-muted-foreground/20"
              }`}>{i + 1}</span>{s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ═══════ Step 1: Basic Info ═══════ */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground">主题图标</label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                      className={`w-9 h-9 rounded-md border text-lg flex items-center justify-center transition-colors ${
                        form.icon === icon ? "border-primary bg-accent" : "border-border hover:bg-muted"
                      }`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">主题名称 *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  placeholder="例如：竞品价格监测" maxLength={20} />
                {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">主题描述 *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none resize-none"
                  rows={2} placeholder="描述主题的核心目标和用途" maxLength={100} />
                {errors.description && <p className="text-[11px] text-destructive mt-1">{errors.description}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">负责人 *</label>
                <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  placeholder="例如：张三" maxLength={20} />
                {errors.owner && <p className="text-[11px] text-destructive mt-1">{errors.owner}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">主题类型 *</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as ThemeConfig["type"] }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="builtin">内置主题</option>
                  <option value="custom">自定义主题</option>
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {form.type === "builtin" ? "内置主题只能由超管创建和编辑" : "自定义主题可以由该主题的管理员编辑"}
                </p>
              </div>
            </div>
          )}

          {/* ═══════ Step 2: Data Sources (inline task config) ═══════ */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">配置采集任务</label>
                <button onClick={addDataSource} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="w-3 h-3" /> 新增任务</button>
              </div>
              {errors.dataSources && <p className="text-[11px] text-destructive">{errors.dataSources}</p>}

              {form.dataSources.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">暂未配置采集任务</p>
                  <button onClick={addDataSource} className="mt-3 px-4 py-1.5 text-xs text-primary border border-primary/30 rounded-md hover:bg-primary/5">添加第一个采集任务</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.dataSources.map((ds, dsIdx) => {
                    const isExpanded = editingDS === ds.taskId;
                    return (
                      <div key={ds.taskId} className="border border-border rounded-lg overflow-hidden">
                        {/* Task header */}
                        <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30 cursor-pointer" onClick={() => setEditingDS(isExpanded ? null : ds.taskId)}>
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                            <span className="text-xs font-medium text-foreground">{ds.taskName || `任务 ${dsIdx + 1}`}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono text-muted-foreground border-border" title="任务ID（保存后可在『采集任务管理』中搜索）">{ds.taskId}</Badge>
                            <Badge className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-0">{ds.taskType}</Badge>
                            {ds.platforms.length > 0 && (
                              <div className="flex gap-1">
                                {ds.platforms.slice(0, 3).map(p => <Badge key={p} className="text-[9px] px-1 py-0 bg-muted text-muted-foreground border-0">{p}</Badge>)}
                                {ds.platforms.length > 3 && <Badge className="text-[9px] px-1 py-0 bg-muted text-muted-foreground border-0">+{ds.platforms.length - 3}</Badge>}
                              </div>
                            )}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); removeDataSource(ds.taskId); }}
                            className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>

                        {/* Task form (expanded) */}
                        {isExpanded && (
                          <div className="p-4 space-y-4 border-t border-border">
                            {/* Task ID (read-only, auto-generated) */}
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/40 rounded-md border border-dashed border-border">
                              <span className="text-[10px] text-muted-foreground">任务ID</span>
                              <code className="text-[11px] font-mono text-foreground">{ds.taskId}</code>
                              <span className="text-[10px] text-muted-foreground ml-auto">系统自动生成，保存后可在『采集任务管理』中按此ID搜索</span>
                            </div>
                            {/* Row 1: Type + Name */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] font-medium text-foreground flex items-center gap-0.5"><span className="text-destructive">*</span> 任务类型</label>
                                <select value={ds.taskType} onChange={e => updateDataSource(ds.taskId, { taskType: e.target.value })}
                                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                                  {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[11px] font-medium text-foreground flex items-center gap-0.5"><span className="text-destructive">*</span> 任务名称</label>
                                <input value={ds.taskName} onChange={e => updateDataSource(ds.taskId, { taskName: e.target.value })}
                                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                                  placeholder="例如：机票话题监控-v1" />
                              </div>
                            </div>

                            {/* Row 2: Owner + Period */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] font-medium text-foreground flex items-center gap-0.5"><span className="text-destructive">*</span> 归属人</label>
                                <select value={ds.owner} onChange={e => updateDataSource(ds.taskId, { owner: e.target.value })}
                                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                                  <option value="">选择归属人</option>
                                  {OWNER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[11px] font-medium text-foreground flex items-center gap-0.5"><span className="text-destructive">*</span> 任务执行周期</label>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <input type="date" value={ds.executionPeriodStart} onChange={e => updateDataSource(ds.taskId, { executionPeriodStart: e.target.value })}
                                    className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" />
                                  <span className="text-xs text-muted-foreground">→</span>
                                  <input type="date" value={ds.executionPeriodEnd} onChange={e => updateDataSource(ds.taskId, { executionPeriodEnd: e.target.value })}
                                    className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" />
                                </div>
                              </div>
                            </div>

                            {/* Row 3: Schedule config */}
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-[11px] font-medium text-foreground flex items-center gap-0.5"><span className="text-destructive">*</span> 任务调度配置</label>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <label className="flex items-center gap-1 text-xs text-foreground cursor-pointer">
                                    <input type="radio" name={`schedule_${ds.taskId}`} checked={ds.scheduleMode === "interval"}
                                      onChange={() => updateDataSource(ds.taskId, { scheduleMode: "interval" })} className="accent-primary" />
                                    间隔模式
                                  </label>
                                  <label className="flex items-center gap-1 text-xs text-foreground cursor-pointer">
                                    <input type="radio" name={`schedule_${ds.taskId}`} checked={ds.scheduleMode === "fixed"}
                                      onChange={() => updateDataSource(ds.taskId, { scheduleMode: "fixed" })} className="accent-primary" />
                                    固定时间模式
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label className="text-[11px] font-medium text-foreground flex items-center gap-0.5"><span className="text-destructive">*</span> 调度时间范围（整点）</label>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <input type="number" min={0} max={23} value={ds.scheduleTimeStart}
                                    onChange={e => updateDataSource(ds.taskId, { scheduleTimeStart: Number(e.target.value) })}
                                    className="w-16 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground text-center" />
                                  <span className="text-xs text-muted-foreground">→</span>
                                  <input type="number" min={0} max={23} value={ds.scheduleTimeEnd}
                                    onChange={e => updateDataSource(ds.taskId, { scheduleTimeEnd: Number(e.target.value) })}
                                    className="w-16 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground text-center" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[11px] font-medium text-foreground flex items-center gap-0.5"><span className="text-destructive">*</span> 间隔（小时）</label>
                                <input type="number" min={1} max={24} value={ds.intervalHours}
                                  onChange={e => updateDataSource(ds.taskId, { intervalHours: Number(e.target.value) })}
                                  className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground" />
                              </div>
                            </div>

                            {/* Task Params */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-[11px] font-medium text-foreground flex items-center gap-0.5"><span className="text-destructive">*</span> 任务参数配置</label>
                                <button onClick={() => addTaskParam(ds.taskId)} className="flex items-center gap-0.5 text-[11px] text-primary hover:underline"><Plus className="w-3 h-3" /> 添加</button>
                              </div>
                              {ds.taskParams.map((tp, tpIdx) => (
                                <div key={tpIdx} className="border border-border rounded-md p-3 mb-2 bg-muted/20 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-muted-foreground">参数组 {tpIdx + 1}</span>
                                    {ds.taskParams.length > 1 && (
                                      <button onClick={() => removeTaskParam(ds.taskId, tpIdx)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                                    )}
                                  </div>

                                  {/* Brand (optional) */}
                                  <div>
                                    <label className="text-[10px] font-medium text-foreground">品牌（可选）</label>
                                    <select value={tp.brand || ""} onChange={e => updateTaskParam(ds.taskId, tpIdx, { brand: e.target.value || undefined })}
                                      className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                                      <option value="">不限品牌</option>
                                      {BRAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                  </div>

                                  {/* Platforms (multi-select dropdown — 发布平台数十个，使用下拉选择) */}
                                  {(() => {
                                    const selectedPlatforms = Array.isArray(tp.platforms) ? tp.platforms : [];
                                    const searchKey = `${ds.taskId}_${tpIdx}`;
                                    const q = (platformSearch[searchKey] || "").trim().toLowerCase();
                                    const filteredPlatforms = q
                                      ? PLATFORM_OPTIONS.filter(p => p.toLowerCase().includes(q))
                                      : PLATFORM_OPTIONS;
                                    return (
                                      <div>
                                        <label className="text-[10px] font-medium text-foreground flex items-center gap-0.5">
                                          <span className="text-destructive">*</span> 发布平台（多选）
                                        </label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <button
                                              type="button"
                                              className="w-full mt-1 min-h-[32px] px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground hover:border-primary/50 flex items-center justify-between gap-2"
                                            >
                                              {selectedPlatforms.length === 0 ? (
                                                <span className="text-muted-foreground">请选择发布平台（共 {PLATFORM_OPTIONS.length} 个）</span>
                                              ) : (
                                                <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
                                                  {selectedPlatforms.slice(0, 6).map(p => (
                                                    <Badge key={p} className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">{p}</Badge>
                                                  ))}
                                                  {selectedPlatforms.length > 6 && (
                                                    <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0">
                                                      +{selectedPlatforms.length - 6}
                                                    </Badge>
                                                  )}
                                                </div>
                                              )}
                                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                            </button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-80 p-0" align="start">
                                            <div className="p-2 border-b border-border">
                                              <div className="relative">
                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                                <input
                                                  value={platformSearch[searchKey] || ""}
                                                  onChange={e => setPlatformSearch(prev => ({ ...prev, [searchKey]: e.target.value }))}
                                                  placeholder="搜索平台..."
                                                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                />
                                              </div>
                                              <div className="flex items-center justify-between mt-2 px-1">
                                                <span className="text-[10px] text-muted-foreground">已选 {selectedPlatforms.length} / {PLATFORM_OPTIONS.length}</span>
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => updateTaskParam(ds.taskId, tpIdx, { platforms: filteredPlatforms })}
                                                    className="text-[10px] text-primary hover:underline"
                                                  >
                                                    全选{q ? "（结果）" : ""}
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => updateTaskParam(ds.taskId, tpIdx, { platforms: [] })}
                                                    className="text-[10px] text-muted-foreground hover:text-destructive"
                                                  >
                                                    清空
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto p-1">
                                              {filteredPlatforms.length === 0 ? (
                                                <div className="py-6 text-center text-[11px] text-muted-foreground">无匹配平台</div>
                                              ) : (
                                                filteredPlatforms.map(p => {
                                                  const checked = selectedPlatforms.includes(p);
                                                  return (
                                                    <button
                                                      key={p}
                                                      type="button"
                                                      onClick={() => toggleTaskParamPlatform(ds.taskId, tpIdx, p)}
                                                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-xs text-left hover:bg-muted/50 ${
                                                        checked ? "text-primary" : "text-foreground"
                                                      }`}
                                                    >
                                                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                                        checked ? "bg-primary border-primary" : "border-border"
                                                      }`}>
                                                        {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                                      </span>
                                                      {p}
                                                    </button>
                                                  );
                                                })
                                              )}
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                    );
                                  })()}

                                  {/* Topics (tag input) */}
                                  <div>
                                    <label className="text-[10px] font-medium text-foreground flex items-center gap-0.5"><span className="text-destructive">*</span> 抓取关键词</label>
                                    <p className="text-[9px] text-muted-foreground">支持英文逗号、中文逗号和顿号分隔多个词，按回车键（Enter）或者右侧按钮完成添加</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <input value={topicInput[`${ds.taskId}_${tpIdx}`] || ""} onChange={e => setTopicInput(prev => ({ ...prev, [`${ds.taskId}_${tpIdx}`]: e.target.value }))}
                                        className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="输入关键词"
                                        onKeyDown={e => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            const val = (topicInput[`${ds.taskId}_${tpIdx}`] || "").trim();
                                            if (val && !tp.topics.includes(val)) {
                                              updateTaskParam(ds.taskId, tpIdx, { topics: [...tp.topics, val] });
                                              setTopicInput(prev => ({ ...prev, [`${ds.taskId}_${tpIdx}`]: "" }));
                                            }
                                          }
                                        }} />
                                      <button onClick={() => {
                                        const val = (topicInput[`${ds.taskId}_${tpIdx}`] || "").trim();
                                        if (val && !tp.topics.includes(val)) {
                                          updateTaskParam(ds.taskId, tpIdx, { topics: [...tp.topics, val] });
                                          setTopicInput(prev => ({ ...prev, [`${ds.taskId}_${tpIdx}`]: "" }));
                                        }
                                      }} className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground hover:bg-muted">添加</button>
                                    </div>
                                    {tp.topics.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {tp.topics.map(topic => (
                                          <Badge key={topic} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border-0 gap-1">
                                            {topic}
                                            <button onClick={() => updateTaskParam(ds.taskId, tpIdx, { topics: tp.topics.filter(t => t !== topic) })}
                                              className="hover:text-destructive">×</button>
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Extended Params */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-[11px] font-medium text-foreground flex items-center gap-1">任务扩展参数配置 <span className="text-muted-foreground text-[10px]">ⓘ</span></label>
                                <button onClick={() => addExtendedParam(ds.taskId)} className="flex items-center gap-0.5 text-[11px] text-primary hover:underline"><Plus className="w-3 h-3" /> 添加</button>
                              </div>
                              {ds.extendedParams.map((ep, epIdx) => (
                                <div key={epIdx} className="border border-border rounded-md p-3 mb-2 bg-muted/20">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[10px] font-medium text-foreground flex items-center gap-0.5"><span className="text-destructive">*</span> 发布平台</label>
                                      <select value={ep.platform} onChange={e => updateExtendedParam(ds.taskId, epIdx, { platform: e.target.value })}
                                        className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                                        <option value="">选择平台</option>
                                        {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                      </select>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="flex-1">
                                        <label className="text-[10px] font-medium text-foreground">最大翻页</label>
                                        <input value={ep.maxPages || ""} onChange={e => updateExtendedParam(ds.taskId, epIdx, { maxPages: e.target.value })}
                                          className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                                          placeholder="最大翻页" />
                                      </div>
                                      {ds.extendedParams.length > 1 && (
                                        <button onClick={() => removeExtendedParam(ds.taskId, epIdx)} className="text-destructive hover:text-destructive/80 mt-5"><Trash2 className="w-3.5 h-3.5" /></button>
                                      )}
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-medium text-foreground">最大抓取量</label>
                                      <input value={ep.maxFetchCount || ""} onChange={e => updateExtendedParam(ds.taskId, epIdx, { maxFetchCount: e.target.value })}
                                        className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground"
                                        placeholder="最大抓取量" />
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-medium text-foreground">排序方式</label>
                                      <select value={ep.sortBy || ""} onChange={e => updateExtendedParam(ds.taskId, epIdx, { sortBy: e.target.value })}
                                        className="w-full mt-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
                                        <option value="">默认</option>
                                        {SORT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════ Step 3: Entry Conditions (basic + advanced) ═══════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">各数据源入主题条件</label>
                <p className="text-[11px] text-muted-foreground mb-3">每个数据源可独立配置入主题规则。基础过滤适用于关键词精准匹配，高级配置支持标签条件组合。</p>

                {form.dataSources.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
                    <p className="text-xs text-muted-foreground">请先在上一步选择数据源</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 mb-3 flex-wrap">
                      {form.dataSources.map(ds => (
                        <button key={ds.taskId} onClick={() => setActiveConditionDS(ds.taskId)}
                          className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                            activeConditionDS === ds.taskId
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border text-muted-foreground hover:bg-muted/50"
                          }`}>
                          {ds.taskName || "未命名"}
                          <span className="ml-1 text-[10px] opacity-60">({ds.platforms.slice(0, 2).join("、")}{ds.platforms.length > 2 ? "…" : ""})</span>
                        </button>
                      ))}
                    </div>

                    {getActiveDS() && (() => {
                      const activeDS = getActiveDS()!;
                      const includeWords = activeDS.includeWords || [];
                      const excludeWords = activeDS.excludeWords || [];
                      const advCollapsed = collapsedGroups[`adv_${activeDS.taskId}`] !== false; // collapsed by default
                      return (
                        <div className="space-y-3">
                          {/* Basic filter — include / exclude words */}
                          <div className="border border-border rounded-lg p-3 bg-card space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">基础过滤条件</Badge>
                                <span className="text-[10px] text-muted-foreground">精准匹配 · 标题/正文/发布人昵称</span>
                              </div>
                              {form.dataSources.length > 1 && (
                                <div className="flex items-center gap-1">
                                  <Copy className="w-3 h-3 text-muted-foreground" />
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      const sourceDS = form.dataSources.find(ds => ds.taskId === e.target.value);
                                      if (sourceDS) {
                                        updateDataSource(activeDS.taskId, {
                                          includeWords: [...(sourceDS.includeWords || [])],
                                          excludeWords: [...(sourceDS.excludeWords || [])],
                                        });
                                      }
                                    }}
                                    className="px-1.5 py-1 text-[10px] border border-border rounded bg-card text-foreground"
                                  >
                                    <option value="">复制基础过滤自...</option>
                                    {form.dataSources.filter(ds => ds.taskId !== activeDS.taskId).map(ds => (
                                      <option key={ds.taskId} value={ds.taskId}>{ds.taskName}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>

                            <WordChipsInput
                              label="包含词"
                              hint="精准匹配，标题/正文/发布人昵称匹配到任意包含词的帖子将被收录"
                              tone="success"
                              words={includeWords}
                              onChange={(words) => updateDataSource(activeDS.taskId, { includeWords: words })}
                            />

                            <WordChipsInput
                              label="过滤词"
                              hint="精准匹配，标题/正文/发布人昵称匹配到任意过滤词的帖子将被丢弃"
                              tone="danger"
                              words={excludeWords}
                              onChange={(words) => updateDataSource(activeDS.taskId, { excludeWords: words })}
                            />
                          </div>

                          {/* Advanced — tag condition tree */}
                          <div className="border border-border rounded-lg overflow-hidden">
                            <button
                              onClick={() => setCollapsedGroups(prev => ({ ...prev, [`adv_${activeDS.taskId}`]: !advCollapsed ? true : false }))}
                              className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {advCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                                <span className="text-xs font-medium text-foreground">高级配置（标签条件）</span>
                                <span className="text-[10px] text-muted-foreground">支持 AND/OR · 最多一层分组</span>
                              </div>
                              {form.dataSources.length > 1 && !advCollapsed && (
                                <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                                  <Copy className="w-3 h-3 text-muted-foreground" />
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      const sourceDS = form.dataSources.find(ds => ds.taskId === e.target.value);
                                      if (sourceDS?.conditionTree) {
                                        const cloneTree = JSON.parse(JSON.stringify(sourceDS.conditionTree));
                                        const reId = (node: any) => {
                                          node.id = `${node.id}_copy_${Date.now()}`;
                                          (node.children || []).forEach(reId);
                                        };
                                        reId(cloneTree);
                                        updateDSConditionTree(activeConditionDS, cloneTree);
                                      }
                                    }}
                                    className="px-1.5 py-1 text-[10px] border border-border rounded bg-card text-foreground"
                                  >
                                    <option value="">复制规则自...</option>
                                    {form.dataSources.filter(ds => ds.taskId !== activeConditionDS).map(ds => (
                                      <option key={ds.taskId} value={ds.taskId}>{ds.taskName}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </button>
                            {!advCollapsed && (
                              <div className="p-3 bg-primary/5">
                                <ConditionTreeEditor
                                  node={getActiveDSTree()}
                                  onAddCondition={addCondition}
                                  onAddGroup={addGroup}
                                  onRemove={removeConditionNode}
                                  onUpdate={updateConditionNode}
                                  depth={0}
                                  isRoot
                                  maxOneGroup
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══════ Step 4: Field Configuration (with display order) ═══════ */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-foreground">展示字段配置</label>
                  <span className="text-[11px] text-muted-foreground">已选 {form.fieldConfigs.length} 个 · 按下方顺序在主题列表展示</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">
                  从下方字段池勾选要展示的字段。已选字段可在上方面板拖拽调整顺序，决定主题列表中的展示排列。
                </p>

                {/* Selected fields with drag-and-drop ordering */}
                {form.fieldConfigs.length > 0 && (
                  <div className="border border-primary/20 rounded-lg p-3 bg-primary/5 mb-4">
                    <div className="text-[11px] font-medium text-foreground mb-2 flex items-center gap-1.5">
                      <GripVertical className="w-3 h-3 text-muted-foreground" />
                      已选字段顺序（拖动 ⋮⋮ 调整）
                    </div>
                    <SortableList
                      items={form.fieldConfigs}
                      onReorder={(items) => setForm(f => ({ ...f, fieldConfigs: items }))}
                      renderItem={(fc, idx, handle) => {
                        const fdef = ALL_FIELDS.find(f => f.key === fc.key);
                        return (
                          <div className="flex items-center gap-2 px-2 py-1.5 bg-card rounded border border-border">
                            {handle}
                            <span className="text-[10px] font-mono text-muted-foreground w-6">{idx + 1}</span>
                            <Badge className={`text-[9px] px-1.5 py-0 border-0 ${
                              fc.fieldType === "ai" ? "bg-purple-500/10 text-purple-600 dark:text-purple-300" :
                              fc.fieldType === "calc" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            }`}>{FIELD_TYPE_LABELS[fc.fieldType]}</Badge>
                            <span className="text-xs text-foreground flex-1">{fdef?.label || fc.key}</span>
                            <button
                              onClick={() => toggleField(fc.key)}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              title="移除"
                            ><Trash2 className="w-3 h-3" /></button>
                          </div>
                        );
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center border border-border rounded-md bg-card px-3 mb-3">
                  <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input value={fieldSearch} onChange={e => setFieldSearch(e.target.value)}
                    className="flex-1 px-2 py-2 text-xs bg-transparent text-foreground outline-none"
                    placeholder="搜索字段名称..." />
                </div>

                {(["ai", "raw", "calc"] as const).map(ftype => {
                  const fields = filteredFields(fieldsByType[ftype]);
                  if (fields.length === 0) return null;
                  const collapsed = collapsedGroups[ftype];
                  const selectedCount = fields.filter(f => form.fieldConfigs.some(fc => fc.key === f.key)).length;
                  const allSelected = selectedCount === fields.length;
                  return (
                    <div key={ftype} className="mb-3">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-t-lg border border-border">
                        <button onClick={() => toggleGroup(ftype)}
                          className="flex items-center gap-2 text-left text-xs font-medium text-foreground hover:text-primary transition-colors">
                          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          <span className={`w-2 h-2 rounded-full ${ftype === "ai" ? "bg-purple-500" : ftype === "calc" ? "bg-primary" : "bg-muted-foreground"}`} />
                          {FIELD_TYPE_LABELS[ftype]}
                          <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0">{fields.length}</Badge>
                          {selectedCount > 0 && <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">已选{selectedCount}</Badge>}
                        </button>
                        <button onClick={() => toggleAllFields(ftype, !allSelected)}
                          className="text-[10px] text-primary hover:underline">{allSelected ? "取消全选" : "全选"}</button>
                      </div>
                      {!collapsed && (
                        <div className="border border-t-0 border-border rounded-b-lg divide-y divide-border">
                          {fields.map(f => {
                            const fc = form.fieldConfigs.find(c => c.key === f.key);
                            const selected = !!fc;
                            return (
                              <div key={f.key} className={`px-3 py-2.5 transition-colors ${selected ? "bg-primary/5" : ""}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div onClick={() => toggleField(f.key)}
                                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer ${selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                                      {selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                    </div>
                                    {selected && fc && (() => {
                                      const orderIdx = form.fieldConfigs.findIndex(c => c.key === f.key);
                                      return (
                                        <Badge className="text-[9px] px-1.5 py-0 bg-primary text-primary-foreground border-0 font-mono">#{orderIdx + 1}</Badge>
                                      );
                                    })()}
                                    <span className="text-xs font-medium text-foreground cursor-pointer" onClick={() => toggleField(f.key)}>{f.label}</span>
                                    {f.hasSystemEnum && (
                                      <Badge className="text-[9px] px-1 py-0 bg-accent text-accent-foreground border-0">有枚举值</Badge>
                                    )}
                                  </div>
                                  {selected && fc && (
                                    <div className="flex items-center gap-2">
                                      <select value={fc.displayPosition} onChange={e => updateFieldConfig(f.key, { displayPosition: e.target.value as FieldConfig["displayPosition"] })}
                                        className="px-1.5 py-1 text-[10px] border border-border rounded bg-card text-foreground">
                                        <option value="list">列表展示</option>
                                        <option value="detail">详情展示</option>
                                        <option value="both">列表+详情</option>
                                      </select>
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-muted-foreground">筛选</span>
                                        <Switch checked={fc.isFilter} onCheckedChange={checked => updateFieldConfig(f.key, { isFilter: checked })} className="scale-75" />
                                      </div>
                                      {fc.isFilter && (
                                        f.hasSystemEnum ? (
                                          <select value={fc.filterType} onChange={e => updateFieldConfig(f.key, { filterType: e.target.value as "enum" | "text" })}
                                            className="px-1.5 py-1 text-[10px] border border-border rounded bg-card text-foreground">
                                            <option value="enum">下拉选择</option>
                                            <option value="text">模糊搜索</option>
                                          </select>
                                        ) : (
                                          <Badge className="text-[9px] px-1.5 py-0 bg-muted text-muted-foreground border-0">模糊搜索</Badge>
                                        )
                                      )}
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-muted-foreground">排序</span>
                                        <Switch checked={fc.isSortable || false} onCheckedChange={checked => updateFieldConfig(f.key, { isSortable: checked, isDefaultSort: false })} className="scale-75" />
                                      </div>
                                      {fc.isSortable && (
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => updateFieldConfig(f.key, { isDefaultSort: true, sortDirection: fc.sortDirection || "desc" })}
                                            className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${
                                              fc.isDefaultSort ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/30"
                                            }`}>默认</button>
                                          {fc.isDefaultSort && (
                                            <select value={fc.sortDirection || "desc"} onChange={e => updateFieldConfig(f.key, { sortDirection: e.target.value as "asc" | "desc" })}
                                              className="px-1 py-0.5 text-[9px] border border-border rounded bg-card text-foreground">
                                              <option value="desc">降序</option>
                                              <option value="asc">升序</option>
                                            </select>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {selected && fc?.isFilter && fc.filterType === "enum" && fc.hasSystemEnum && (
                                  <div className="ml-7 mt-1.5 flex flex-wrap gap-1">
                                    <span className="text-[10px] text-muted-foreground mr-1">枚举值（来自标签管理）：</span>
                                    {fc.enumValues.map(v => <Badge key={v} variant="outline" className="text-[10px] px-1.5 py-0">{v}</Badge>)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {form.fieldConfigs.some(fc => fc.isDefaultSort) && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 mt-2">
                    <p className="text-[11px] text-primary">
                      📋 默认排序：按「{form.fieldConfigs.find(fc => fc.isDefaultSort)?.key && ALL_FIELDS.find(f => f.key === form.fieldConfigs.find(fc => fc.isDefaultSort)?.key)?.label}」
                      {form.fieldConfigs.find(fc => fc.isDefaultSort)?.sortDirection === "asc" ? "升序" : "降序"}排列
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ Step 5: Merge Pipeline ═══════ */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-primary" /> 合并管线配置
                </label>
                <button onClick={addMergeNode} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="w-3 h-3" /> 添加合并节点</button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                配置多级合并管线。支持 AND/OR 和 () 嵌套条件组合（如"24小时内发布 且 (文本相似度≥70% 或 话题相同)"）。每个节点可配置展示字段、筛选和排序。
              </p>

              {sortedMergeNodes.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <GitMerge className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">暂未配置合并节点</p>
                  <button onClick={addMergeNode} className="mt-3 px-4 py-1.5 text-xs text-primary border border-primary/30 rounded-md hover:bg-primary/5">添加第一个合并节点</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedMergeNodes.map((node, i) => (
                    <div key={node.id} className={`border rounded-lg overflow-hidden transition-colors ${node.enabled ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`}>
                      {/* Node header */}
                      <div className="flex items-center justify-between p-3 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">第{i + 1}级</Badge>
                          <input value={node.name} onChange={e => updateMergeNode(node.id, { name: e.target.value })}
                            className="text-xs font-medium text-foreground bg-transparent border-none outline-none w-32" placeholder="节点名称" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveMergeNode(node.id, "up")} disabled={i === 0} className="p-1 rounded hover:bg-accent text-muted-foreground disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                          <button onClick={() => moveMergeNode(node.id, "down")} disabled={i === sortedMergeNodes.length - 1} className="p-1 rounded hover:bg-accent text-muted-foreground disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                          <Switch checked={node.enabled} onCheckedChange={checked => updateMergeNode(node.id, { enabled: checked })} className="scale-75 mx-1" />
                          <button onClick={() => removeMergeNode(node.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>

                      {node.enabled && (
                        <div className="p-3 space-y-3">
                          {/* Merge condition tree */}
                          <div className="p-3 bg-card rounded-md border border-border space-y-2">
                            <label className="text-[10px] text-muted-foreground">合并条件（支持 AND / OR 和 () 嵌套）</label>
                            <MergeConditionTreeEditor
                              node={node.mergeConditionTree || { id: `mct_${node.id}`, type: "group", logic: "AND", children: [] }}
                              mergeNodeId={node.id}
                              onAddCondition={addMergeTreeCondition}
                              onAddGroup={addMergeTreeGroup}
                              onRemove={removeMergeTreeNode}
                              onUpdate={updateMergeTreeNode}
                              depth={0}
                              isRoot
                            />
                            {node.mergeConditionTree && (node.mergeConditionTree.children || []).length > 0 && (
                              <div className="bg-muted/30 rounded p-2 mt-1">
                                <p className="text-[10px] text-primary">💡 合并规则：{mergeConditionTreeToText(node.mergeConditionTree)}</p>
                              </div>
                            )}
                          </div>

                          {/* Display fields for merge result - grouped by type */}
                          <div className="p-3 bg-card rounded-md border border-border space-y-2">
                            <label className="text-[10px] text-muted-foreground">合并后展示字段（AI标签/原始字段/计算字段）</label>

                            <div className="flex items-center border border-border rounded-md bg-card px-2 mb-2">
                              <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                              <input value={mergeFieldSearch} onChange={e => setMergeFieldSearch(e.target.value)}
                                className="flex-1 px-2 py-1.5 text-[10px] bg-transparent text-foreground outline-none"
                                placeholder="搜索字段..." />
                            </div>

                            {(["ai", "raw", "calc"] as const).map(ftype => {
                              const fields = ALL_FIELDS.filter(f => f.fieldType === ftype).filter(f => !mergeFieldSearch || f.label.includes(mergeFieldSearch) || f.key.includes(mergeFieldSearch));
                              if (fields.length === 0) return null;
                              const selectedCount = fields.filter(f => (node.displayFields || []).some(d => d.key === f.key)).length;
                              const allSelected = selectedCount === fields.length;
                              const collapsed = collapsedGroups[`merge_${node.id}_${ftype}`];
                              return (
                                <div key={ftype} className="mb-1">
                                  <div className="flex items-center justify-between px-2 py-1.5 bg-muted/40 rounded-t border border-border">
                                    <button onClick={() => toggleGroup(`merge_${node.id}_${ftype}`)} className="flex items-center gap-1.5 text-[10px] font-medium text-foreground">
                                      {collapsed ? <ChevronRight className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                      <span className={`w-1.5 h-1.5 rounded-full ${ftype === "ai" ? "bg-purple-500" : ftype === "calc" ? "bg-primary" : "bg-muted-foreground"}`} />
                                      {FIELD_TYPE_LABELS[ftype]}
                                      <Badge className="text-[9px] px-1 py-0 bg-muted text-muted-foreground border-0">{fields.length}</Badge>
                                      {selectedCount > 0 && <Badge className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-0">已选{selectedCount}</Badge>}
                                    </button>
                                    <button onClick={() => toggleAllMergeDisplayFields(node.id, ftype, !allSelected)}
                                      className="text-[9px] text-primary hover:underline">{allSelected ? "取消全选" : "全选"}</button>
                                  </div>
                                  {!collapsed && (
                                    <div className="border border-t-0 border-border rounded-b divide-y divide-border">
                                      {fields.map(f => {
                                        const df = (node.displayFields || []).find(d => d.key === f.key);
                                        const selected = !!df;
                                        return (
                                          <div key={f.key} className={`px-2 py-1.5 transition-colors ${selected ? "bg-primary/5" : ""}`}>
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleMergeDisplayField(node.id, f.key)}>
                                                <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                                                  {selected && <Check className="w-2 h-2 text-primary-foreground" />}
                                                </div>
                                                <span className="text-[10px] font-medium text-foreground">{f.label}</span>
                                              </div>
                                              {selected && df && (
                                                <div className="flex items-center gap-1.5">
                                                  <select value={df.position} onChange={e => updateMergeDisplayField(node.id, df.key, { position: e.target.value as MergeDisplayField["position"] })}
                                                    className="px-1 py-0.5 text-[9px] border border-border rounded bg-card text-foreground">
                                                    <option value="list">列表</option><option value="detail">详情</option><option value="both">都展示</option>
                                                  </select>
                                                  <div className="flex items-center gap-0.5">
                                                    <span className="text-[9px] text-muted-foreground">筛选</span>
                                                    <Switch checked={df.isFilter || false} onCheckedChange={checked => updateMergeDisplayField(node.id, df.key, { isFilter: checked })} className="scale-[0.55]" />
                                                  </div>
                                                  {df.isFilter && f.hasSystemEnum && (
                                                    <select value={df.filterType || "enum"} onChange={e => updateMergeDisplayField(node.id, df.key, { filterType: e.target.value as "enum" | "text" })}
                                                      className="px-1 py-0.5 text-[8px] border border-border rounded bg-card text-foreground">
                                                      <option value="enum">下拉</option><option value="text">搜索</option>
                                                    </select>
                                                  )}
                                                  <div className="flex items-center gap-0.5">
                                                    <span className="text-[9px] text-muted-foreground">排序</span>
                                                    <Switch checked={df.isSortable || false} onCheckedChange={checked => updateMergeDisplayField(node.id, df.key, { isSortable: checked, isDefaultSort: false })} className="scale-[0.55]" />
                                                  </div>
                                                  {df.isSortable && (
                                                    <div className="flex items-center gap-0.5">
                                                      <button onClick={() => updateMergeDisplayField(node.id, df.key, { isDefaultSort: true, sortDirection: df.sortDirection || "desc" })}
                                                        className={`px-1 py-0.5 text-[8px] rounded border ${df.isDefaultSort ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>默认</button>
                                                      {df.isDefaultSort && (
                                                        <select value={df.sortDirection || "desc"} onChange={e => updateMergeDisplayField(node.id, df.key, { sortDirection: e.target.value as "asc" | "desc" })}
                                                          className="px-0.5 py-0.5 text-[8px] border border-border rounded bg-card text-foreground">
                                                          <option value="desc">降序</option><option value="asc">升序</option>
                                                        </select>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Merge default sort summary */}
                            {(node.displayFields || []).some(df => df.isDefaultSort) && (
                              <div className="bg-primary/5 border border-primary/20 rounded p-2 mt-1">
                                <p className="text-[10px] text-primary">
                                  📋 默认排序：按「{ALL_FIELDS.find(f => f.key === (node.displayFields || []).find(df => df.isDefaultSort)?.key)?.label}」
                                  {(node.displayFields || []).find(df => df.isDefaultSort)?.sortDirection === "asc" ? "升序" : "降序"}排列
                                </p>
                              </div>
                            )}
                          </div>

                          {i > 0 && (
                            <div className="bg-muted/30 rounded p-2">
                              <p className="text-[10px] text-muted-foreground">💡 此节点将基于第{i}级「{sortedMergeNodes[i - 1]?.name}」的合并结果进行再合并</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pipeline preview */}
                  <div className="bg-muted/30 rounded-lg p-3 border border-dashed border-border mt-4">
                    <p className="text-[11px] text-muted-foreground mb-1.5">📋 管线预览</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className="text-[10px] px-2 py-0.5 bg-muted text-foreground border-0">全部帖子</Badge>
                      {sortedMergeNodes.filter(n => n.enabled).map((n, ni) => (
                        <div key={n.id} className="flex items-center gap-1.5">
                          <span className="text-muted-foreground text-[10px]">→</span>
                          <div className="text-[10px]">
                            <Badge className="px-2 py-0.5 bg-primary/10 text-primary border-0">第{ni + 1}级：{n.name}</Badge>
                            {n.mergeConditionTree && (n.mergeConditionTree.children || []).length > 0 && (
                              <span className="text-muted-foreground ml-1">{mergeConditionTreeToText(n.mergeConditionTree)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border shrink-0">
          <div className="text-[11px] text-muted-foreground">步骤 {step + 1} / {steps.length}</div>
          <div className="flex gap-2">
            <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-xs border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors">取消</button>
            {step > 0 && <button onClick={handlePrev} className="px-4 py-2 text-xs border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors">上一步</button>}
            {step < steps.length - 1 ? (
              <button onClick={handleNext} className="px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium">下一步</button>
            ) : (
              <button onClick={handleSave} className="px-4 py-2 text-xs gradient-primary text-primary-foreground rounded-md font-medium">{isEdit ? "保存修改" : "创建主题"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Merge Condition Tree Editor ──────────────────────────────

const MERGE_COND_OPS = [
  { value: "similarity_gte", label: "相似度 ≥ (%)" },
  { value: "time_within", label: "时间窗口内 (小时)" },
  { value: "equals", label: "字段值相同" },
  { value: "contains", label: "字段值包含" },
];

function MergeConditionTreeEditor({
  node, mergeNodeId, onAddCondition, onAddGroup, onRemove, onUpdate, depth, isRoot,
}: {
  node: MergeConditionNode; mergeNodeId: string;
  onAddCondition: (mergeNodeId: string, parentId: string) => void;
  onAddGroup: (mergeNodeId: string, parentId: string) => void;
  onRemove: (mergeNodeId: string, nodeId: string) => void;
  onUpdate: (mergeNodeId: string, nodeId: string, u: Partial<MergeConditionNode>) => void;
  depth: number; isRoot?: boolean;
}) {
  if (node.type === "condition") {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <select value={node.field || ""} onChange={e => onUpdate(mergeNodeId, node.id, { field: e.target.value })}
          className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground flex-1 min-w-[100px]">
          <option value="">选择字段</option>
          {ALL_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}（{FIELD_TYPE_LABELS[f.fieldType]}）</option>)}
        </select>
        <select value={node.operator || "equals"} onChange={e => onUpdate(mergeNodeId, node.id, { operator: e.target.value as any })}
          className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
          {MERGE_COND_OPS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
        </select>
        {node.operator !== "equals" && (
          <input value={node.value || ""} onChange={e => onUpdate(mergeNodeId, node.id, { value: e.target.value })}
            className="w-20 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
            placeholder={node.operator === "similarity_gte" ? "80" : node.operator === "time_within" ? "24" : "值"} />
        )}
        {node.operator === "similarity_gte" && <span className="text-[10px] text-muted-foreground shrink-0">%</span>}
        {node.operator === "time_within" && <span className="text-[10px] text-muted-foreground shrink-0">小时</span>}
        <button onClick={() => onRemove(mergeNodeId, node.id)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-3 h-3" /></button>
      </div>
    );
  }

  const children = node.children || [];
  return (
    <div className={`rounded-lg border ${depth === 0 ? "border-border" : "border-primary/20 bg-primary/5"} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {!isRoot && <span className="text-[10px] text-muted-foreground">(</span>}
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            <button onClick={() => onUpdate(mergeNodeId, node.id, { logic: "AND" })}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${node.logic === "AND" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>AND</button>
            <button onClick={() => onUpdate(mergeNodeId, node.id, { logic: "OR" })}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${node.logic === "OR" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>OR</button>
          </div>
          {!isRoot && <span className="text-[10px] text-muted-foreground">)</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onAddCondition(mergeNodeId, node.id)} className="flex items-center gap-0.5 text-[10px] text-primary hover:underline"><Plus className="w-2.5 h-2.5" />条件</button>
          <button onClick={() => onAddGroup(mergeNodeId, node.id)} className="flex items-center gap-0.5 text-[10px] text-primary hover:underline ml-2"><Plus className="w-2.5 h-2.5" />分组()</button>
          {!isRoot && <button onClick={() => onRemove(mergeNodeId, node.id)} className="ml-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>}
        </div>
      </div>
      <div className="space-y-1 ml-2">
        {children.map((child, ci) => (
          <div key={child.id}>
            {ci > 0 && <div className="text-[10px] text-primary font-medium py-0.5 ml-2">{node.logic}</div>}
            <MergeConditionTreeEditor node={child} mergeNodeId={mergeNodeId} onAddCondition={onAddCondition} onAddGroup={onAddGroup} onRemove={onRemove} onUpdate={onUpdate} depth={depth + 1} />
          </div>
        ))}
        {children.length === 0 && <p className="text-[10px] text-muted-foreground py-2 text-center">点击上方按钮添加条件或嵌套分组</p>}
      </div>
    </div>
  );
}

// ── Nested Condition Tree Editor ────────────────────────────

function ConditionTreeEditor({
  node, onAddCondition, onAddGroup, onRemove, onUpdate, depth, isRoot, maxOneGroup,
}: {
  node: ConditionNode; onAddCondition: (parentId: string) => void; onAddGroup: (parentId: string) => void;
  onRemove: (id: string) => void; onUpdate: (id: string, u: Partial<ConditionNode>) => void;
  depth: number; isRoot?: boolean; maxOneGroup?: boolean;
}) {
  if (node.type === "condition") {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <select value={node.field || ""} onChange={e => onUpdate(node.id, { field: e.target.value })}
          className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground flex-1 min-w-[100px]">
          <option value="">选择字段</option>
          {ALL_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        <select value={node.operator || "equals"} onChange={e => onUpdate(node.id, { operator: e.target.value })}
          className="px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground">
          {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
        </select>
        {(() => {
          const fieldDef = ALL_FIELDS.find(f => f.key === node.field);
          if (fieldDef?.hasSystemEnum && fieldDef.enumValues.length > 0) {
            return (
              <select value={node.value || ""} onChange={e => onUpdate(node.id, { value: e.target.value })}
                className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground min-w-[80px]">
                <option value="">选择值</option>
                {fieldDef.enumValues.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            );
          }
          return (
            <input value={node.value || ""} onChange={e => onUpdate(node.id, { value: e.target.value })}
              className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-card text-foreground focus:ring-1 focus:ring-primary outline-none min-w-[80px]"
              placeholder="输入值" />
          );
        })()}
        <button onClick={() => onRemove(node.id)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-3 h-3" /></button>
      </div>
    );
  }

  const children = node.children || [];
  return (
    <div className={`rounded-lg border ${depth === 0 ? "border-border" : "border-primary/20 bg-primary/5"} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {!isRoot && <span className="text-[10px] text-muted-foreground">(</span>}
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            <button onClick={() => onUpdate(node.id, { logic: "AND" })}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${node.logic === "AND" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>AND</button>
            <button onClick={() => onUpdate(node.id, { logic: "OR" })}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${node.logic === "OR" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>OR</button>
          </div>
          {!isRoot && <span className="text-[10px] text-muted-foreground">)</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onAddCondition(node.id)} className="flex items-center gap-0.5 text-[10px] text-primary hover:underline"><Plus className="w-2.5 h-2.5" />条件</button>
          {(() => {
            const hasGroupChild = children.some(c => c.type === "group");
            const canAddGroup = !maxOneGroup || (isRoot && !hasGroupChild);
            return canAddGroup ? (
              <button onClick={() => onAddGroup(node.id)} className="flex items-center gap-0.5 text-[10px] text-primary hover:underline ml-2"><Plus className="w-2.5 h-2.5" />分组()</button>
            ) : null;
          })()}
          {!isRoot && <button onClick={() => onRemove(node.id)} className="ml-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>}
        </div>
      </div>
      <div className="space-y-1 ml-2">
        {children.map((child, ci) => (
          <div key={child.id}>
            {ci > 0 && <div className="text-[10px] text-primary font-medium py-0.5 ml-2">{node.logic}</div>}
            <ConditionTreeEditor node={child} onAddCondition={onAddCondition} onAddGroup={onAddGroup} onRemove={onRemove} onUpdate={onUpdate} depth={depth + 1} maxOneGroup={maxOneGroup} />
          </div>
        ))}
        {children.length === 0 && <p className="text-[10px] text-muted-foreground py-2 text-center">点击上方按钮添加条件或嵌套分组</p>}
      </div>
    </div>
  );
}

// ── Tree manipulation helpers ───────────────────────────────

function insertIntoTree(tree: ConditionNode, parentId: string, newNode: ConditionNode): ConditionNode {
  if (tree.id === parentId && tree.type === "group") {
    return { ...tree, children: [...(tree.children || []), newNode] };
  }
  if (tree.type === "group" && tree.children) {
    return { ...tree, children: tree.children.map(c => insertIntoTree(c, parentId, newNode)) };
  }
  return tree;
}

function removeFromTree(tree: ConditionNode, nodeId: string): ConditionNode {
  if (tree.type === "group" && tree.children) {
    return { ...tree, children: tree.children.filter(c => c.id !== nodeId).map(c => removeFromTree(c, nodeId)) };
  }
  return tree;
}

function updateInTree(tree: ConditionNode, nodeId: string, update: Partial<ConditionNode>): ConditionNode {
  if (tree.id === nodeId) return { ...tree, ...update };
  if (tree.type === "group" && tree.children) {
    return { ...tree, children: tree.children.map(c => updateInTree(c, nodeId, update)) };
  }
  return tree;
}

// ── Merge Condition Tree helpers ────────────────────────────

import type { MergeConditionNode as MCN } from "@/pages/ThemeSettings";

function insertIntoMergeTree(tree: MCN, parentId: string, newNode: MCN): MCN {
  if (tree.id === parentId && tree.type === "group") {
    return { ...tree, children: [...(tree.children || []), newNode] };
  }
  if (tree.type === "group" && tree.children) {
    return { ...tree, children: tree.children.map(c => insertIntoMergeTree(c, parentId, newNode)) };
  }
  return tree;
}

function removeFromMergeTree(tree: MCN, nodeId: string): MCN {
  if (tree.type === "group" && tree.children) {
    return { ...tree, children: tree.children.filter(c => c.id !== nodeId).map(c => removeFromMergeTree(c, nodeId)) };
  }
  return tree;
}

function updateInMergeTree(tree: MCN, nodeId: string, update: Partial<MCN>): MCN {
  if (tree.id === nodeId) return { ...tree, ...update };
  if (tree.type === "group" && tree.children) {
    return { ...tree, children: tree.children.map(c => updateInMergeTree(c, nodeId, update)) };
  }
  return tree;
}

export function mergeConditionTreeToText(node: MCN | undefined): string {
  if (!node) return "";
  if (node.type === "condition") {
    const MERGE_FIELD_LABELS: Record<string, string> = {
      sentiment: "情感倾向", risk_level: "风险等级", topic: "话题分类", intent: "用户意图",
      platform: "平台", publish_time: "发布时间", author: "作者", content: "内容正文",
      likes: "点赞数", comments: "评论数", shares: "分享数", reads: "阅读数",
      heat_score: "热度指数", risk_score: "风险分数", ferment_level: "发酵等级",
      sov: "SOV份额", nps: "NPS评分", growth_rate: "增长率",
    };
    const fl = MERGE_FIELD_LABELS[node.field || ""] || node.field || "";
    if (node.operator === "similarity_gte") return `${fl}≥${node.value}%`;
    if (node.operator === "time_within") return `${node.value}h窗口`;
    if (node.operator === "equals") return `${fl}相同`;
    if (node.operator === "contains") return `${fl}包含${node.value}`;
    return `${fl} ${node.operator} ${node.value}`;
  }
  const childTexts = (node.children || []).map(c => mergeConditionTreeToText(c)).filter(Boolean);
  if (childTexts.length === 0) return "";
  const joined = childTexts.join(node.logic === "OR" ? " 或 " : " 且 ");
  return childTexts.length > 1 ? `(${joined})` : joined;
}

// ── WordChipsInput: chip-style include/exclude word editor ──
function WordChipsInput({
  label, hint, tone, words, onChange,
}: {
  label: string;
  hint: string;
  tone: "success" | "danger";
  words: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const toneClass = tone === "success"
    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
    : "bg-destructive/10 text-destructive border-destructive/30";

  const commit = () => {
    const parts = draft.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const merged = Array.from(new Set([...words, ...parts]));
    onChange(merged);
    setDraft("");
  };

  const removeAt = (i: number) => {
    const next = words.slice();
    next.splice(i, 1);
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{label}</label>
        <span className="text-[10px] text-muted-foreground">{words.length} 个词</span>
      </div>
      <p className="text-[10px] text-muted-foreground">{hint}</p>
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 border border-border rounded-md bg-background min-h-[36px] focus-within:ring-1 focus-within:ring-primary">
        {words.map((w, i) => (
          <span key={`${w}_${i}`} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded border ${toneClass}`}>
            {w}
            <button onClick={() => removeAt(i)} className="opacity-60 hover:opacity-100">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && !draft && words.length > 0) {
              removeAt(words.length - 1);
            }
          }}
          onBlur={commit}
          placeholder={words.length === 0 ? "输入后回车或逗号添加，可批量粘贴" : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
