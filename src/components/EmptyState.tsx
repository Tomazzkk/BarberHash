import { ReactNode } from 'react';

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
};

const EmptyState = ({ icon, title, description, children }: EmptyStateProps) => {
  return (
    <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
      <div className="bg-muted p-4 rounded-full">{icon}</div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default EmptyState;