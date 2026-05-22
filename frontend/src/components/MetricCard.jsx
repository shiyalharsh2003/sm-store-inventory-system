import React from 'react';

export default function MetricCard({ title, value, subtext, icon: Icon, color = 'brand' }) {
  const getColorClasses = () => {
    switch (color) {
      case 'brand':
        return {
          iconBg: 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400',
          shadow: 'hover:shadow-brand-500/5',
          border: 'hover:border-brand-300 dark:hover:border-brand-800'
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
          shadow: 'hover:shadow-emerald-500/5',
          border: 'hover:border-emerald-300 dark:hover:border-emerald-800'
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
          shadow: 'hover:shadow-amber-500/5',
          border: 'hover:border-amber-300 dark:hover:border-amber-800'
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
          shadow: 'hover:shadow-rose-500/5',
          border: 'hover:border-rose-300 dark:hover:border-rose-800'
        };
      default:
        return {
          iconBg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
          shadow: 'hover:shadow-slate-500/5',
          border: 'hover:border-slate-300 dark:hover:border-slate-800'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-premium transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 ${colors.shadow} ${colors.border}`}>
      
      {/* Top Row: Title & Small Icon */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block truncate">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${colors.iconBg} shadow-sm flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className="stroke-[2.5]" />
        </div>
      </div>

      {/* Bottom Row: Full Value & Subtext */}
      <div className="space-y-1 text-left">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 dark:text-slate-100 font-sans tracking-tight leading-none">
          {value}
        </h3>
        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
          {subtext}
        </p>
      </div>

    </div>
  );
}
