'use client';

import { useState } from 'react';
import { acknowledgeIntervention } from '@/actions/acknowledgeIntervention';
import { CheckCircle } from 'lucide-react';

export default function AcknowledgeButton({ interventionId, patientId, isAcknowledged, acknowledgedAt }) {
  const [loading, setLoading] = useState(false);

  // If already acknowledged, show a success badge
  if (isAcknowledged) {
    return (
      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 transition-colors">
        <CheckCircle size={18} />
        <span>Acknowledged on {new Date(acknowledgedAt).toLocaleDateString()}</span>
      </div>
    );
  }

  // If not acknowledged, show the actionable button
  return (
    <button 
      onClick={async () => {
        setLoading(true);
        await acknowledgeIntervention(interventionId, patientId);
        // We don't need to set loading to false because revalidatePath will refresh the component
      }}
      disabled={loading}
      className="flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-70"
    >
      <CheckCircle size={18} className={loading ? "animate-pulse" : ""} />
      {loading ? 'Processing...' : 'Acknowledge Instructions'}
    </button>
  );
}