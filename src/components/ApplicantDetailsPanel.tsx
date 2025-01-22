import { User } from 'lucide-react';
import { Applicant } from '../types/applicant';

interface ApplicantDetailsPanelProps {
  applicant: Applicant | null;
}

export default function ApplicantDetailsPanel({ applicant }: ApplicantDetailsPanelProps) {
  if (!applicant) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <User className="w-12 h-12 mx-auto mb-4" />
          <p>Select an applicant to view details</p>
        </div>
      </div>
    );
  }

  const formatPercent = (value: number | null): string => {
    if (value === null || isNaN(value)) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-2xl font-bold mb-6">{applicant.name}</h2>
      <div className="space-y-6">
        <Section title="Applicant Details">
          <InfoRow label="Casper Z-Score" value={applicant.casper_z.toFixed(2)} />
          <InfoRow label="Parent Education" value={applicant.parent_ed} />
          <InfoRow label="Household Income" value={applicant.household_income} />
        </Section>

        <Section title="High School Information">
          <InfoRow 
            label="High School Poverty" 
            value={formatPercent(applicant.meps_poverty_pct || 0)} 
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-700">{title}</h3>
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}