import { Institution } from '../types/institution';
import { School } from 'lucide-react';

interface DetailsPanelProps {
  institution: Institution | null;
  averageMidIncome?: number;
}

export default function DetailsPanel({ institution, averageMidIncome = 0.33 }: DetailsPanelProps) {
  if (!institution) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <School className="w-12 h-12 mx-auto mb-4" />
          <p>Select an institution to view details</p>
        </div>
      </div>
    );
  }

  const formatNumber = (value: number | null): string => {
    if (value === null || isNaN(value)) return 'N/A';
    return value.toLocaleString();
  };

  const formatPercent = (value: number | null): string => {
    if (value === null || isNaN(value)) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number | null): string => {
    if (value === null || isNaN(value)) return 'N/A';
    return `$${value.toLocaleString()}`;
  };

  const formatString = (value: number | null): string => {
    if (value === null || isNaN(value)) return 'N/A';
    return value.toString();
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-2xl font-bold mb-6">{institution.inst_name}</h2>
      <div className="space-y-6">
        <Section title="Institution Details">
          <InfoRow label="School ID" value={formatString(institution.unitid)} />
        </Section>

        <Section title="Admission Statistics">
          <InfoRow label="Applications" value={formatNumber(institution.number_applied)} />
          <InfoRow label="Admitted" value={formatNumber(institution.number_admitted)} />
          <InfoRow label="Enrolled" value={formatNumber(institution.number_enrolled_total)} />
          <InfoRow label="Admission Rate" value={formatPercent(institution.admit_rate)} />
          <InfoRow label="Yield Rate" value={formatPercent(institution.yield_rate)} />
        </Section>

        <Section title="Financial Information">
          <InfoRow label="Average aid per student" value={formatCurrency(institution.sum_average_amount)} />
          <InfoRow label="Percent of students with aid" value={formatPercent(institution.percent_of_students)} />
        </Section>

        <Section title="Demographics">
          <div>
            <div className="flex justify-between">
              <span className="text-gray-600">Middle Income Students</span>
              <span className="font-medium">{formatPercent(institution.midincome_pct)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Average across schools:</span>
              <span>{formatPercent(averageMidIncome)}</span>
            </div>
          </div>
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