'use client';

import { useParams } from 'next/navigation';

const Breadcrumb = ({ items }) => (
  <nav className="flex items-center space-x-2 mb-6">
    {items.map((item, index) => (
      <div key={index} className="flex items-center">
        {index > 0 && <span className="text-gray-400 mx-2">/</span>}
        <span className={index === items.length - 1 ? 'text-gray-700 font-semibold' : 'text-blue-600'}>
          {item}
        </span>
      </div>
    ))}
  </nav>
);

export default function SettingsPage() {
  const params = useParams();
  const { id } = params;

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={['Settings', 'Account Settings']} />
      
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Settings</h1>
        <p className="text-gray-600 mb-6">
          Clinician ID: <span className="font-mono text-gray-700">{id}</span>
        </p>
        
        <div className="flex flex-col items-center justify-center py-16">
          <svg
            className="w-16 h-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Coming Soon</h2>
          <p className="text-gray-600 text-center max-w-md">
            The Settings feature is currently under development. Check back soon to customize your account preferences.
          </p>
        </div>
      </div>
    </div>
  );
}
