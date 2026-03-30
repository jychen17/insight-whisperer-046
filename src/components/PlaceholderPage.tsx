import { Construction } from "lucide-react";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <Construction className="w-12 h-12 text-primary/40 mb-4" />
      <h2 className="text-lg font-medium text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground">此功能模块正在建设中，敬请期待</p>
    </div>
  );
}
