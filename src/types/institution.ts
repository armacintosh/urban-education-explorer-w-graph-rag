export interface Institution {
  unitid: number;
  year: number;
  zip: string;
  opeid: string;
  inst_name: string;
  inst_alias: string;
  longitude: number;
  latitude: number;
  cc_basic_2021: number;
  cc_instruc_undergrad_2021: number;
  cc_instruc_grad_2021: number;
  cc_size_setting_2021: number;
  number_applied: number;
  number_admitted: number;
  number_enrolled_total: number;
  admit_rate: number;
  yield_rate: number;
  sum_average_amount: number;
  sum_total_amount: number;
  percent_of_students: number;
  bach_home_zip_pct: number | null;
  hhinc_home_zip_med: number | null;
  poverty_rate_home_zip: number | null;
}