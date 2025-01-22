import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Institution } from '../types/institution';

interface SearchFilterPanelProps {
  institutions: Institution[];
  onFilterChange: (filtered: Institution[]) => void;
}

export default function SearchFilterPanel({ institutions, onFilterChange }: SearchFilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [admitRateFilter, setAdmitRateFilter] = useState('');

  useEffect(() => {
    const filtered = institutions.filter(inst => {
      const matchesSearch = searchTerm === '' || 
        inst.inst_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAdmitRate = !admitRateFilter || (
        admitRateFilter === 'selective' 
          ? inst.admit_rate * 100 <= 30 
          : inst.admit_rate * 100 > 30
      );
      return matchesSearch && matchesAdmitRate;
    });
    
    onFilterChange(filtered);
  }, [searchTerm, admitRateFilter, institutions]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="bg-white shadow-lg rounded-lg mb-4 p-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search schools..."
            className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <select
          value={admitRateFilter}
          onChange={(e) => setAdmitRateFilter(e.target.value)}
          className="border rounded-lg p-2 w-64"
        >
          <option value="">All Admission Rates</option>
          <option value="selective">Selective (&lt;= 30%)</option>
          <option value="other">&gt; 30%</option>
        </select>
        <div className="text-sm text-gray-600">
          Total Schools: {institutions.length}
        </div>
      </div>
    </div>
  );
}