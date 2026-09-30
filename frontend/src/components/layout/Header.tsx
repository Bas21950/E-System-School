'use client';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function Header({ title, subtitle, children, className }: HeaderProps) {
  return (
    <header className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 ${className || ''}`}>
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </header>
  );
}
