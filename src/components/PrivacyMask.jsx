'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PrivacyMask({ children, defaultVisible = false }) {
  const [isVisible, setIsVisible] = useState(defaultVisible);

  return (
    <span 
      className="inline-flex items-center gap-2 group cursor-pointer"
      onClick={() => setIsVisible(!isVisible)}
      title="Click to reveal/hide sensitive data"
    >
      <span className={`transition-all duration-200 ${!isVisible ? 'blur-sm select-none opacity-50' : ''}`}>
        {isVisible ? children : '••••••••••••'}
      </span>
      <button 
        type="button"
        className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
        aria-label={isVisible ? "Hide data" : "Show data"}
      >
        {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
    </span>
  );
}