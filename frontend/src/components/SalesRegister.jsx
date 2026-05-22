import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, Barcode, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SalesRegister() {
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartQty, 
    clearCart, 
    checkoutCart,
    stateLoading
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [skuQuery, setSkuQuery] = useState('');
  const [skuSuccess, setSkuSuccess] = useState(false);
  const [activePosTab, setActivePosTab] = useState('catalog');

  // Exact SKU barcode scan simulation lookup
  const handleSkuSubmit = (e) => {
    e.preventDefault();
    if (!skuQuery.trim()) return;

    const matchedProduct = products.find(
      (p) => p.sku.toUpperCase() === skuQuery.toUpperCase().trim()
    );

    if (matchedProduct) {
      addToCart(matchedProduct);
      setSkuQuery('');
      setSkuSuccess(true);
      setTimeout(() => setSkuSuccess(false), 1500);
    } else {
      alert(`Product SKU "${skuQuery}" not found in current catalog.`);
    }
  };

  // Filter products by name or SKU
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.cartQty, 0);

  return (
    <div className="flex flex-col h-full font-sans text-left">
      {/* Mobile POS Tab Switcher */}
      <div className="flex lg:hidden bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-4 border border-slate-200 dark:border-slate-700/50 flex-shrink-0">
        <button
          type="button"
          onClick={() => setActivePosTab('catalog')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activePosTab === 'catalog'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Products Catalog ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActivePosTab('cart')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all relative ${
            activePosTab === 'cart'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Checkout Cart
          {cart.length > 0 && (
            <span className="absolute top-1.5 right-4 w-4 h-4 text-[9px] font-black rounded-full bg-emerald-500 text-white flex items-center justify-center animate-pulse">
              {cart.reduce((sum, item) => sum + item.cartQty, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-17rem)] lg:h-[calc(100vh-13rem)] overflow-hidden">
        
        {/* LEFT PANEL: Catalog Selection */}
        <div className={`lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium p-6 flex-col h-full overflow-hidden transition-colors duration-300 ${
          activePosTab === 'catalog' ? 'flex' : 'hidden lg:flex'
        }`}>
        
        {/* Search & Barcode Lookup Section */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-shrink-0">
          {/* General Search */}
          <div className="relative flex-grow">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalog by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-400 text-slate-700 dark:text-slate-200"
            />
          </div>

          {/* Barcode/SKU exact lookup simulator */}
          <form onSubmit={handleSkuSubmit} className="relative sm:w-56">
            <input
              type="text"
              placeholder="Simulate SKU Scan..."
              value={skuQuery}
              onChange={(e) => setSkuQuery(e.target.value)}
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs font-bold uppercase focus:outline-none focus:ring-2 transition-all ${
                skuSuccess 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-brand-500'
              }`}
            />
            <Barcode size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${skuSuccess ? 'text-emerald-500' : 'text-slate-400'}`} />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-brand-500 text-white text-[10px] font-extrabold hover:bg-brand-600 transition-colors"
            >
              {skuSuccess ? <Check size={10} className="stroke-[3]" /> : 'Lookup'}
            </button>
          </form>
        </div>

        {/* Catalog Selection Grid list */}
        <div className="flex-grow overflow-y-auto pr-1 space-y-3">
          {filteredProducts.length === 0 ? (
            <p className="text-sm font-semibold text-slate-400 text-center py-12">No products available in this selection.</p>
          ) : (
            filteredProducts.map((p) => {
              const inCart = cart.find(item => item.id === p.id);
              const remainingStock = p.stock_quantity - (inCart ? inCart.cartQty : 0);
              const isLowStock = p.stock_quantity <= p.min_stock_level;

              return (
                <div 
                  key={p.id} 
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    remainingStock === 0
                      ? 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                      : 'bg-slate-50/50 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800/40 hover:border-brand-200 dark:hover:border-brand-900/40'
                  }`}
                >
                  <div className="pr-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 uppercase tracking-wide">
                        {p.sku}
                      </span>
                      {isLowStock && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded">
                          Low Stock Alert
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{p.name}</h4>
                    <p className="text-xs text-slate-400 truncate max-w-sm mt-0.5">{p.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex items-center gap-5 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans">
                        ₹{parseFloat(p.price).toFixed(2)}
                      </p>
                      <p className={`text-[10px] font-bold ${remainingStock <= 5 ? 'text-red-500' : 'text-slate-400'}`}>
                        {remainingStock === 0 ? 'Out of Stock' : `${remainingStock} available`}
                      </p>
                    </div>

                    <button
                      onClick={() => addToCart(p)}
                      disabled={remainingStock <= 0}
                      className="px-3.5 py-2 rounded-xl text-xs font-black text-white bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 transition-all flex items-center gap-1.5"
                    >
                      <Plus size={12} className="stroke-[3]" />
                      Add
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* RIGHT PANEL: Current Bill Cart */}
      <div className={`lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium p-6 flex-col h-full overflow-hidden transition-colors duration-300 ${
        activePosTab === 'cart' ? 'flex' : 'hidden lg:flex'
      }`}>
        
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-500 stroke-[2.5]" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Checkout Cart</h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-bold text-red-500 dark:text-red-400 hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Selected Items List */}
        <div className="flex-grow overflow-y-auto py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
              <ShoppingCart size={42} className="text-slate-300 dark:text-slate-700 stroke-[1.5] mb-3" />
              <p className="text-xs font-semibold text-slate-400">Sales register is currently empty.</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Select items from the catalog or lookup a SKU barcode to begin.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.id} 
                className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3"
              >
                <div className="overflow-hidden pr-2">
                  <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">{item.name}</h5>
                  <p className="text-[10px] text-brand-600 dark:text-brand-400 font-bold mt-0.5">₹{parseFloat(item.price).toFixed(2)} each</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Quantity adjustment triggers */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => updateCartQty(item.id, item.cartQty - 1, item.stock_quantity)}
                      className="p-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-white transition-colors"
                    >
                      <Minus size={10} className="stroke-[3]" />
                    </button>
                    <span className="text-xs font-black w-6 text-center text-slate-800 dark:text-white">
                      {item.cartQty}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.id, item.cartQty + 1, item.stock_quantity)}
                      className="p-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-white transition-colors"
                    >
                      <Plus size={10} className="stroke-[3]" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing Summary & Checkout Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Subtotal Amount</span>
              <span className="text-slate-600 dark:text-slate-350">₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Tax (GST @ 18% included)</span>
              <span className="text-slate-600 dark:text-slate-350">₹{(cartTotal * 0.18).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-800 dark:text-slate-100 pt-1 border-t border-dashed border-slate-100 dark:border-slate-800">
              <span>Total Payable</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={checkoutCart}
            disabled={cart.length === 0 || stateLoading}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-black rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart size={14} className="stroke-[3]" />
            {stateLoading ? 'Processing Checkout...' : 'Record OUT Transaction (Checkout)'}
          </button>
        </div>

      </div>

    </div>
  </div>
  );
}
