'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Breadcrumb() {
  const pathname = usePathname();
  
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs = segments.map((segment, index) => {
    const isNumeric = /^\d+$/.test(segment);
    const label = isNumeric ? 'Patient' : segment.charAt(0).toUpperCase() + segment.slice(1);
    const href = '/' + segments.slice(0, index + 1).join('/');
    
    return {
      label,
      href,
      isLast: index === segments.length - 1,
    };
  });

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Link href="/" className="hover:text-gray-900 transition-colors">
        Home
      </Link>
      {breadcrumbs.map((crumb) => (
        <div key={crumb.href} className="flex items-center space-x-2">
          <span className="text-gray-400">/</span>
          {crumb.isLast ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-gray-900 transition-colors">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
