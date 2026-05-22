import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function SupplierForm({ onSubmitSuccess }) {
  const { addSupplier } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    phone: ''
  });

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, contact_email, phone } = formData;

    if (!name.trim() || !contact_email.trim() || !phone.trim()) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact_email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      await addSupplier({
        name: name.trim(),
        contact_email: contact_email.toLowerCase().trim(),
        phone: phone.trim()
      });
      onSubmitSuccess();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to register supplier.';
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

      {/* Supplier Name */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          Supplier Business Name *
        </label>
        <input
          type="text"
          name="name"
          placeholder="e.g. Apex Electronics Ltd"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Contact Email */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          Contact Email *
        </label>
        <input
          type="email"
          name="contact_email"
          placeholder="e.g. support@supplier.com"
          value={formData.contact_email}
          onChange={handleChange}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Telephone Phone */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          Phone Number *
        </label>
        <input
          type="text"
          name="phone"
          placeholder="e.g. +91 98765 43210"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Registering...' : 'Register Supplier'}
        </button>
      </div>

    </form>
  );
}
