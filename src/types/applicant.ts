export interface Applicant {
  applicant_id: string;
  name: string;
  casper_z: number;
  parent_ed: string;
  household_income: string;
  zip: number;
  meps_poverty_pct: number;
  summary: string;
  applied_to: number[];
}