import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function ProductForm({ initialData, onSubmitSuccess }) {
  const { suppliers, addProduct, updateProduct } = useApp();
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    min_stock_level: '5',
    supplier_id: ''
  });

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        sku: initialData.sku || '',
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price?.toString() || '',
        stock_quantity: initialData.stock_quantity?.toString() || '',
        min_stock_level: initialData.min_stock_level?.toString() || '5',
        supplier_id: initialData.supplier_id?.toString() || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError(''); // clear error when user updates fields
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { sku, name, price, stock_quantity, min_stock_level, supplier_id } = formData;

    // Direct UI Validations
    if (!sku.trim() || !name.trim() || !price || !stock_quantity) {
      setValidationError('Please fill in all required fields marked with (*).');
      return;
    }

    if (parseFloat(price) < 0) {
      setValidationError('Price cannot be a negative value.');
      return;
    }

    if (parseInt(stock_quantity, 10) < 0) {
      setValidationError('Stock quantity cannot be negative.');
      return;
    }

    if (parseInt(min_stock_level, 10) < 0) {
      setValidationError('Minimum stock threshold level cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      const payload = {
        sku: sku.toUpperCase().trim(),
        name: name.trim(),
        description: formData.description.trim(),
        price: parseFloat(price),
        stock_quantity: parseInt(stock_quantity, 10),
        min_stock_level: parseInt(min_stock_level, 10),
        supplier_id: supplier_id ? parseInt(supplier_id, 10) : null
      };

      if (initialData?.id) {
        await updateProduct(initialData.id, payload);
      } else {
        await addProduct(payload);
      }
      onSubmitSuccess();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Operation failed. Please verify SKU is unique.';
      setValidationError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-left">
      
      {validationError && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold transition-all">
          {validationError}
        </div>
      )}

      {/* Grid SKU & Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Product SKU *
          </label>
          <input
            type="text"
            name="sku"
            placeholder="e.g. ELEC-KB-002"
            value={formData.sku}
            onChange={handleChange}
            disabled={!!initialData} // Lock SKU on edit
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Product Name *
          </label>
          <input
            type="text"
            name="name"
            placeholder="e.g. Wireless Mouse"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          Description
        </label>
        <textarea
          name="description"
          placeholder="Detailed specs or features..."
          rows={2}
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      {/* Grid Pricing, Stock & Threshold */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Price (INR) *
          </label>
          <input
            type="number"
            name="price"
            placeholder="0.00"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Current Stock *
          </label>
          <input
            type="number"
            name="stock_quantity"
            placeholder="0"
            min="0"
            value={formData.stock_quantity}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Min Alert level
          </label>
          <input
            type="number"
            name="min_stock_level"
            placeholder="5"
            min="0"
            value={formData.min_stock_level}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Supplier Selection */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          Linked Supplier
        </label>
        <select
          name="supplier_id"
          value={formData.supplier_id}
          onChange={handleChange}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">-- Select Supplier (Optional) --</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.contact_email})
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Processing request...' : initialData ? 'Save Product Changes' : 'Register New Product'}
        </button>
      </div>

    </form>
  );
}
