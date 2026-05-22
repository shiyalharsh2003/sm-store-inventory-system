import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';
import DataTable from './components/DataTable';
import ActionModal from './components/ActionModal';
import ProductForm from './components/ProductForm';
import SupplierForm from './components/SupplierForm';
import SalesRegister from './components/SalesRegister';
import { 
  Package, 
  Users, 
  History, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Info,
  CheckCircle,
  XCircle,
  PackageCheck
} from 'lucide-react';

// Recharts imports for premium business analysis charts
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

function MainAppContent() {
  const { 
    isAuthenticated, 
    authLoading,
    stateLoading,
    products, 
    suppliers, 
    transactions, 
    lowStockProducts, 
    notification,
    login,
    register,
    deleteProduct,
    recordStockTransaction
  } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth Screen State
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState('10');

  // Handle Auth submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        await login(authForm.email, authForm.password);
      } else {
        await register(authForm.username, authForm.email, authForm.password);
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Authentication action failed. Verify inputs.');
    }
  };

  const handleAuthFieldChange = (e) => {
    const { name, value } = e.target;
    setAuthForm(prev => ({ ...prev, [name]: value }));
    setAuthError('');
  };

  // Quick manual restock transaction execution
  const handleExecuteRestock = async (e) => {
    e.preventDefault();
    if (!restockProduct || !restockQty) return;
    const qty = parseInt(restockQty, 10);
    if (qty <= 0) {
      alert("Please provide a quantity greater than zero.");
      return;
    }
    try {
      await recordStockTransaction(restockProduct.id, 'IN', qty);
      setIsRestockModalOpen(false);
      setRestockProduct(null);
      setRestockQty('10');
    } catch (err) {
      alert(err.response?.data?.error || "Restock failed.");
    }
  };

  // Render Auth Portal Screen
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 font-sans relative overflow-hidden">
        {/* Abstract Glowing Backdrop Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl z-10 text-left">
          
          <div className="flex items-center gap-3.5 justify-center mb-6">
            <div className="bg-brand-500 text-white p-3 rounded-2xl shadow-lg shadow-brand-500/20">
              <PackageCheck size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-none tracking-tight">StockSense</h2>
              <span className="text-[10px] text-brand-400 font-bold uppercase tracking-widest block mt-0.5">Inventory Portal</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-100 text-center mb-6">
            {authMode === 'login' ? 'Access Inventory Workspace' : 'Register New Merchant'}
          </h3>

          {authError && (
            <div className="p-3.5 mb-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs font-bold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Business Name</label>
                <input
                  type="text"
                  name="username"
                  placeholder="e.g. Rajesh Retailers"
                  value={authForm.username}
                  onChange={handleAuthFieldChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Owner Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="e.g. rajesh@store.com"
                value={authForm.email}
                onChange={handleAuthFieldChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Secure Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={authForm.password}
                onChange={handleAuthFieldChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-xs tracking-wider uppercase"
            >
              {authLoading ? 'Authorizing Context...' : authMode === 'login' ? 'Login Dashboard' : 'Register Merchant'}
            </button>
          </form>

          {/* Toggle login / register */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              {authMode === 'login' 
                ? "First time here? Register business account" 
                : "Already registered? Login to existing workspace"}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Dashboard Aggregation Variables
  const totalProducts = products.length;
  const totalInStock = products.reduce((acc, p) => acc + p.stock_quantity, 0);
  const totalSupplierCount = suppliers.length;
  
  // Calculate total monetary valuation of current assets
  const stockValuation = products.reduce((acc, p) => acc + (parseFloat(p.price) * p.stock_quantity), 0);
  
  // Calculate historical checkout sales (transaction type = 'OUT')
  const outTransactions = transactions.filter(t => t.transaction_type === 'OUT');
  const totalOutflowQty = outTransactions.reduce((acc, t) => acc + t.quantity, 0);
  
  // Simulated overall turnover (Total outflows * respective item current catalog price)
  const totalSalesVal = outTransactions.reduce((acc, t) => {
    const matchedProduct = products.find(p => p.id === t.product_id);
    const price = matchedProduct ? matchedProduct.price : 0;
    return acc + (price * t.quantity);
  }, 0);

  // Group transactions for the last 7 days to generate Recharts graph
  const getGraphData = () => {
    const dataMap = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }).reverse();

    // Seed zeros
    last7Days.forEach(day => {
      dataMap[day] = { name: day, Sales: 0, Restocks: 0 };
    });

    // Populate actual logs
    transactions.forEach(t => {
      const day = new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (dataMap[day]) {
        if (t.transaction_type === 'OUT') {
          const matchedProd = products.find(p => p.id === t.product_id);
          const price = matchedProd ? matchedProd.price : 0;
          dataMap[day].Sales += parseFloat(price) * t.quantity;
        } else {
          dataMap[day].Restocks += t.quantity;
        }
      }
    });

    return Object.values(dataMap);
  };

  // Product Catalog Columns Mapping
  const productColumns = [
    { 
      header: 'SKU', 
      accessor: 'sku', 
      render: (row) => (
        <span className="font-extrabold text-slate-800 dark:text-slate-100 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs tracking-wider">
          {row.sku}
        </span>
      )
    },
    { 
      header: 'Product Name', 
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{row.name}</p>
          <p className="text-[10px] text-slate-400 font-semibold truncate max-w-xs">{row.description}</p>
        </div>
      )
    },
    { 
      header: 'Linked Supplier', 
      accessor: 'supplier_name', 
      render: (row) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {row.supplier_name || 'N/A'}
        </span>
      )
    },
    { 
      header: 'Price (INR)', 
      accessor: 'price', 
      render: (row) => (
        <span className="font-extrabold text-slate-800 dark:text-slate-200 font-sans">
          ₹{parseFloat(row.price).toFixed(2)}
        </span>
      ) 
    },
    { 
      header: 'Current Stock', 
      accessor: 'stock_quantity', 
      render: (row) => {
        const isLow = row.stock_quantity <= row.min_stock_level;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-black text-sm ${isLow ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>
              {row.stock_quantity} units
            </span>
            {isLow && (
              <span className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 text-[9px] font-bold">
                Low
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Restock Action',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => {
            setRestockProduct(row);
            setIsRestockModalOpen(true);
          }}
          className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 hover:text-brand-700 text-[10px] font-black rounded-lg border border-brand-150 dark:border-brand-900/30 transition-all flex items-center gap-1"
        >
          <Plus size={10} className="stroke-[3]" />
          Stock IN
        </button>
      )
    }
  ];

  // Supplier Columns Mapping
  const supplierColumns = [
    { header: 'Supplier Name', accessor: 'name', className: 'font-bold text-slate-800 dark:text-slate-200' },
    { header: 'Contact Email', accessor: 'contact_email' },
    { header: 'Telephone Phone', accessor: 'phone', className: 'font-mono text-xs' }
  ];

  // Transaction Ledger Columns Mapping
  const transactionColumns = [
    { 
      header: 'Audit ID', 
      accessor: 'id', 
      render: (row) => <span className="font-mono text-xs text-slate-400">#TX-{row.id}</span>
    },
    { 
      header: 'Linked Product', 
      accessor: 'product_name', 
      render: (row) => (
        <div>
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{row.product_name}</p>
          <span className="font-mono text-[9px] text-slate-400 uppercase">{row.product_sku}</span>
        </div>
      )
    },
    { 
      header: 'Adjust Type', 
      accessor: 'transaction_type', 
      render: (row) => {
        const isOut = row.transaction_type === 'OUT';
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
            isOut 
              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20' 
              : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20'
          }`}>
            {isOut ? 'Stock OUT (Sale)' : 'Stock IN (Restock)'}
          </span>
        );
      }
    },
    { 
      header: 'Quantity Adj.', 
      accessor: 'quantity', 
      render: (row) => (
        <span className="font-black text-slate-800 dark:text-slate-200 text-sm">
          {row.transaction_type === 'OUT' ? '-' : '+'}{row.quantity} units
        </span>
      )
    },
    { 
      header: 'Timestamp', 
      accessor: 'date', 
      render: (row) => (
        <span className="text-xs text-slate-400 font-semibold font-mono">
          {new Date(row.date).toLocaleString()}
        </span>
      )
    }
  ];

  return (
    <div className="h-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Navbar Header */}
        <Navbar 
          activeTab={activeTab} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        {/* Dynamic Inner Panel Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
          
          {/* Global Loader Overlay */}
          {stateLoading && (
            <div className="absolute top-4 right-8 z-50 flex items-center gap-2 bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Syncing Ledger...
            </div>
          )}

          {/* VIEW: DASHBOARD PANEL */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Metric Aggregators Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard 
                  title="Total Products" 
                  value={totalProducts} 
                  subtext={`${totalInStock} items currently held`} 
                  icon={Package} 
                  color="brand" 
                />
                <MetricCard 
                  title="Asset Valuation" 
                  value={`₹${stockValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                  subtext="Monetary stock worth" 
                  icon={DollarSign} 
                  color="emerald" 
                />
                <MetricCard 
                  title="Turnover Volume" 
                  value={`₹${totalSalesVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                  subtext={`${totalOutflowQty} items sold out`} 
                  icon={TrendingUp} 
                  color="brand" 
                />
                <MetricCard 
                  title="Low Stock warnings" 
                  value={lowStockProducts.length} 
                  subtext="Items require attention" 
                  icon={AlertTriangle} 
                  color={lowStockProducts.length > 0 ? 'rose' : 'emerald'} 
                />
              </div>

              {/* Grid: Trend curve + Side summaries */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 7-Day Trend Chart panel */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 tracking-tight">Sales & Activity Trend</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Rolling 7-day visual business analytics</p>
                    </div>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getGraphData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                        <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: 'none', 
                            borderRadius: '12px', 
                            fontSize: '11px',
                            color: '#fff',
                            fontWeight: '600'
                          }} 
                        />
                        <Area type="monotone" dataKey="Sales" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name="Sales Value (₹)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Dashboard Side list: Actionable alerts summary */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium flex flex-col h-[400px]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 tracking-tight">Replenishment List</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Immediate reorders required</p>
                    </div>
                  </div>

                  <div className="flex-grow overflow-y-auto mt-4 space-y-3 pr-1">
                    {lowStockProducts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <Package size={32} className="text-emerald-500 mb-2 stroke-[1.5]" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Stock levels optimal!</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">No products require reorder.</p>
                      </div>
                    ) : (
                      lowStockProducts.map(p => (
                        <div key={p.id} className="p-3 bg-red-50/50 dark:bg-red-950/10 rounded-2xl border border-red-100 dark:border-red-900/20 flex items-center justify-between gap-3">
                          <div className="overflow-hidden">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</h5>
                            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">{p.sku}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-red-500">{p.stock_quantity} left</span>
                            <p className="text-[9px] text-slate-400 font-bold">Min: {p.min_stock_level}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* VIEW: PRODUCTS CATALOG VIEW */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              {/* View header actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium">
                <div className="text-left w-full sm:w-auto">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 tracking-tight">Active Stock Registry</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Add products, lookup SKUs, or run stock replenishment actions.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsProductModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs uppercase"
                >
                  <Plus size={14} className="stroke-[3]" />
                  Register New Product
                </button>
              </div>

              {/* Master Products Table */}
              <DataTable
                columns={productColumns}
                data={products}
                searchKey="name"
                searchPlaceholder="Search catalog by name or SKU..."
                onEdit={(product) => {
                  setEditingProduct(product);
                  setIsProductModalOpen(true);
                }}
                onDelete={async (product) => {
                  if (confirm(`Are you absolutely sure you want to delete product "${product.name}"? This removes all transactional logs for this item.`)) {
                    await deleteProduct(product.id);
                  }
                }}
                csvFilename="products-catalog.csv"
              />

            </div>
          )}

          {/* VIEW: POINT OF SALE (POS) */}
          {activeTab === 'sales' && (
            <SalesRegister />
          )}

          {/* VIEW: SUPPLIERS VIEW */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              
              {/* Header card */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium">
                <div className="text-left w-full sm:w-auto">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 tracking-tight">Suppliers Directory</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Directory of registered suppliers linked to products.</p>
                </div>
                <button
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs uppercase"
                >
                  <Plus size={14} className="stroke-[3]" />
                  Register Supplier
                </button>
              </div>

              {/* Suppliers Data table */}
              <DataTable
                columns={supplierColumns}
                data={suppliers}
                searchKey="name"
                searchPlaceholder="Search suppliers..."
                csvFilename="suppliers-directory.csv"
              />

            </div>
          )}

          {/* VIEW: TRANSACTION LEDGER LOGS */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium text-left">
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 tracking-tight">Historical Stock Audit Ledger</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Immutable transactional list recording stock outflows (sales) and stock inflows (replenishments).</p>
              </div>

              <DataTable
                columns={transactionColumns}
                data={transactions}
                searchKey="product_name"
                searchPlaceholder="Search logs by product name..."
                csvFilename="transactions-audit-trail.csv"
              />

            </div>
          )}

        </main>
      </div>

      {/* GLOBAL NOTIFICATION SLIDE-IN TOAST */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-800 dark:border-slate-200 shadow-2xl flex items-center gap-3 animate-float max-w-sm">
          {notification.type === 'success' ? (
            <CheckCircle className="text-emerald-400 stroke-[2.5]" size={20} />
          ) : notification.type === 'error' ? (
            <XCircle className="text-red-400 stroke-[2.5]" size={20} />
          ) : (
            <Info className="text-brand-400 stroke-[2.5]" size={20} />
          )}
          <span className="text-xs font-bold font-sans pr-2">
            {notification.message}
          </span>
        </div>
      )}

      {/* MODAL: Product Form dialog */}
      <ActionModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? `Edit Catalog Details: ${editingProduct.sku}` : 'Register New Catalog Product'}
      >
        <ProductForm
          initialData={editingProduct}
          onSubmitSuccess={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
        />
      </ActionModal>

      {/* MODAL: Supplier registration dialog */}
      <ActionModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Register Supplier Profile"
      >
        <SupplierForm
          onSubmitSuccess={() => setIsSupplierModalOpen(false)}
        />
      </ActionModal>

      {/* MODAL: Quick Manual Restock (IN Transaction) Dialog */}
      <ActionModal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false);
          setRestockProduct(null);
          setRestockQty('10');
        }}
        title={restockProduct ? `Stock Replenishment IN: ${restockProduct.name}` : 'Stock Replenishment'}
      >
        {restockProduct && (
          <form onSubmit={handleExecuteRestock} className="space-y-4 font-sans text-left">
            <div className="p-3.5 bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/40 rounded-xl">
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest block mb-0.5">Product SKU</span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">{restockProduct.sku}</p>
              
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest block mt-2.5 mb-0.5">Current Stock Balance</span>
              <p className="font-black text-sm text-slate-800 dark:text-slate-200">{restockProduct.stock_quantity} units</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Restock Inflow Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[10px] text-slate-400 font-semibold mt-1">This adds units to the catalog and creates a transactional IN log.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                Record Stock Inflow (Restock)
              </button>
            </div>
          </form>
        )}
      </ActionModal>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
