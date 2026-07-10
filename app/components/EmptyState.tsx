import { Logo } from "./Logo";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="flex justify-center">
        <Logo href="" />
      </div>
      <h2 className="mt-6 text-2xl font-black text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
