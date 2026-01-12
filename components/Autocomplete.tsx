
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { InventoryItem } from '../types';
import { gasService } from '../services/gasService';
import { useDebounce } from '../hooks/useDebounce';

interface AutocompleteProps {
  onSelect: (item: InventoryItem) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export interface AutocompleteHandle {
  focus: () => void;
}

const Autocomplete = forwardRef<AutocompleteHandle, AutocompleteProps>(({ onSelect, placeholder, className, autoFocus }, ref) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<InventoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await gasService.searchItems(debouncedQuery);
        setSuggestions(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        } else if (suggestions.length === 1) {
          handleSelect(suggestions[0]);
        }
        break;
      case 'Tab':
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (item: InventoryItem) => {
    onSelect(item);
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          className={`w-full pl-12 pr-12 py-3 bg-slate-900/50 border rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-900 transition-all placeholder-slate-600 ${isOpen && suggestions.length > 0 ? 'border-indigo-500/30' : 'border-white/5'}`}
          placeholder={placeholder || "Cari barang..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          ) : query.length > 0 && (
            <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="text-slate-600 hover:text-slate-400 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            </button>
          )}
        </div>
      </div>

      {isOpen && (suggestions.length > 0 || (debouncedQuery.length >= 2 && !isSearching && suggestions.length === 0)) && (
        <ul className="absolute z-[100] w-full mt-2 glass-card rounded-2xl border border-white/10 shadow-3xl max-h-64 overflow-y-auto divide-y divide-white/5 animate-fadeIn scrollbar-hide">
          {suggestions.length > 0 ? suggestions.map((item, index) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-5 py-3 cursor-pointer transition-all flex justify-between items-center group/item ${
                index === selectedIndex ? 'bg-indigo-500/20 text-white' : 'hover:bg-white/5 text-slate-300'
              }`}
            >
              <div>
                <div className="font-bold text-sm group-hover/item:text-indigo-400 transition-colors">{item.name}</div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">SKU: {item.sku}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-slate-200">{item.stock} {item.defaultUnit}</div>
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mt-1">{item.category}</div>
              </div>
            </li>
          )) : (
            <li className="px-5 py-8 text-center text-slate-500 font-bold uppercase tracking-widest italic text-[10px]">
              Tidak ada data yang cocok
            </li>
          )}
        </ul>
      )}
    </div>
  );
});

export default Autocomplete;
