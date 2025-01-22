import React, { useEffect, useRef } from 'react';
import { Applicant } from '../types/applicant';
import { Brain } from 'lucide-react';

interface ApplicantListProps {
  applicants: Applicant[];
  selectedApplicant: Applicant | null;
  onApplicantSelect: (applicant: Applicant) => void;
}

export default function ApplicantList({ 
  applicants, 
  selectedApplicant, 
  onApplicantSelect 
}: ApplicantListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedApplicant) return;
      
      const currentIndex = applicants.findIndex(a => a.applicant_id === selectedApplicant.applicant_id);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onApplicantSelect(applicants[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && currentIndex < applicants.length - 1) {
        onApplicantSelect(applicants[currentIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [applicants, selectedApplicant, onApplicantSelect]);

  return (
    <div 
      ref={containerRef}
      className="overflow-x-auto pb-4 px-5 hide-scrollbar"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="flex gap-4">
        {applicants.map((applicant) => (
          <button
            key={applicant.applicant_id}
            onClick={() => onApplicantSelect(applicant)}
            className={`
              flex-none w-64 p-4 rounded-lg transition-all
              ${selectedApplicant?.applicant_id === applicant.applicant_id
                ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                : 'bg-white border border-gray-200 hover:border-blue-300 shadow-sm'
              }
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {applicant.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {applicant.applied_to.length} schools
                </p>
              </div>
              <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-600">
                  {applicant.casper_z.toFixed(2)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}