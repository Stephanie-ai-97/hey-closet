import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageContainer({ children, title, subtitle, actions }: PageContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="p-4 md:p-8 max-w-7xl mx-auto w-full"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{title}</h1>
          {subtitle && (
            <p className="text-zinc-500 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </header>
      {children}
    </motion.div>
  );
}
