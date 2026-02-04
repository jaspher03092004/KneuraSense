'use client';

import { use } from 'react';
import Breadcrumb from '@/components/Breadcrumb';

export default function AnalyticsPage({ params }) {
  const { id } = use(params);
  const lastUpdated = new Date().toLocaleString();

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Breadcrumb />
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Last Updated: {lastUpdated}</p>
          <p className="text-sm text-gray-600 mt-1">Clinician ID: {id}</p>
        </header>

        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Charts & Metrics</h3>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-400">Chart Placeholder</div>
        </section>
      </div>
    </div>
  );
}
