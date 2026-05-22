import React, { useState } from 'react';
import { Search, Download, Edit2, Trash2, ArrowLeft, ArrowRight, Eye } from 'lucide-react';

export default function DataTable({ 
  columns, 
  data, 
  searchPlaceholder = 'Search catalog...', 
  searchKey = 'name',
  onEdit, 
  onDelete,
  onView,
  csvFilename = 'exported-data.csv'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Filter rows based on search query
  const filteredData = data.filter((row) => {
    const value = row[searchKey];
    if (!value) return false;
    return value.toString().toLowerCase().includes(searchQuery.toLowerCase()) || 
           (row.sku && row.sku.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Professional client-side CSV Exporter
  const exportToCSV = () => {
    if (data.length === 0) return;
    
    // Extract headers based on column fields
    const headers = columns.map(col => col.header).join(',');
    
    // Map data rows to CSV fields
    const csvRows = data.map(row => {
      return columns.map(col => {
        const val = row[col.accessor];
        // Handle strings with commas or newlines
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val !== undefined ? val : '';
      }).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", csvFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-premium overflow-hidden transition-colors duration-300">
      
      {/* Table Toolbar */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Field */}
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all placeholder-slate-400"
          />
        </div>

        {/* CSV Exporter */}
        <button
          onClick={exportToCSV}
          disabled={data.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          Export Data to CSV
        </button>

      </div>

      {/* Main Table viewport */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {currentItems.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)} 
                  className="px-6 py-12 text-center text-sm font-semibold text-slate-400"
                >
                  No matching data records found in this inventory.
                </td>
              </tr>
            ) : (
              currentItems.map((row, idx) => (
                <tr 
                  key={row.id || idx} 
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors duration-150"
                >
                  {columns.map((col, cIdx) => (
                    <td 
                      key={cIdx} 
                      className={`px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                  
                  {/* Row Actions */}
                  {(onEdit || onDelete || onView) && (
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-1.5 h-full">
                      {onView && (
                        <button
                          onClick={() => onView(row)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-1.5 rounded-lg text-brand-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-slate-400">
            Showing <strong className="text-slate-700 dark:text-slate-300">{indexOfFirstItem + 1}</strong> to{' '}
            <strong className="text-slate-700 dark:text-slate-300">{Math.min(indexOfLastItem, totalItems)}</strong> of{' '}
            <strong className="text-slate-700 dark:text-slate-300">{totalItems}</strong> entries
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={14} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  currentPage === page
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
