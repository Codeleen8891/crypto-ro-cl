import { ReactNode } from "react";

export default function StatCard({
  title,
  value,
  icon,
}: {
  title: string | ReactNode;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/70">{title}</p>
        {icon}
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}
