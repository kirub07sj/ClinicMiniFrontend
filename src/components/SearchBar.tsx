import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = 'Search by name, phone, or patient ID...' }) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
      />
    </div>
  );
};

export default SearchBar;
