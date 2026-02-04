'use client';

import { use } from 'react';
import Breadcrumb from '@/components/Breadcrumb';

export default function RecommendationsPage({ params }) {
  const { id } = use(params);

  return (
    <div className="p-8 bg-white h-full">
      <Breadcrumb />
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Activity Recommendations</h1>
          <p className="text-gray-600 mt-2">Patient ID: {id}</p>
        </div>

        {/* Coming Soon Section */}
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">💡</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
            <p className="text-gray-600 max-w-md">
              Personalized activity recommendations powered by AI are currently under development. Check back soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
