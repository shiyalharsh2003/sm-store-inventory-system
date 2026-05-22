import React, { useState, useEffect } from 'react';
import { Sun, Moon, Bell, AlertTriangle, Menu } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar({ activeTab, onToggleSidebar }) {
  const { lowStockProducts, user } = useApp();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'products': return 'Product Catalog';
      case 'sales': return 'Point of Sale (POS)';
      case 'suppliers': return 'Supplier Management';
      case 'transactions': return 'Transaction History';
      default: return 'Store Manager';
    }
  };

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between z-30 transition-colors duration-300 relative">
      {/* Page Title & Hamburger Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-all"
          aria-label="Open Sidebar Navigation Menu"
        >
          <Menu size={20} className="stroke-[2.5]" />
        </button>
        <div>
          <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight leading-tight">
            {getTitle()}
          </h2>
          <p className="hidden sm:block text-[10px] sm:text-xs text-slate-400 font-medium">
            Manage stock and track transactions in real-time.
          </p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-4">
        
        {/* Low Stock Warning Banner Button */}
        <div className="relative">
          <button 
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
              lowStockProducts.length > 0
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 pulse-red-ring'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/40 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {lowStockProducts.length > 0 ? (
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={18} />
                <span className="text-xs font-bold font-sans">{lowStockProducts.length} Alerts</span>
              </div>
            ) : (
              <Bell size={18} />
            )}
          </button>

          {/* Low Stock Alerts Dropdown Box */}
          {showAlertsDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAlertsDropdown(false)} />
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 p-4 animate-float">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Low Stock Warnings</h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                    {lowStockProducts.length} Items
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2.5">
                  {lowStockProducts.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">All stock levels are optimal! 🎉</p>
                  ) : (
                    lowStockProducts.map(p => (
                      <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between border border-slate-100 dark:border-slate-800/50">
                        <div className="overflow-hidden pr-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">SKU: {p.sku}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-extrabold text-red-500">{p.stock_quantity} Left</span>
                          <p className="text-[9px] text-slate-400">Min: {p.min_stock_level}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-all"
          aria-label="Toggle Theme Mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Current Greeting Card */}
        {user && (
          <div className="hidden md:flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold">Active Session</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.username}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
