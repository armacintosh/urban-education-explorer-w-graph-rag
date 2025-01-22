import { Institution } from '../types/institution';

const preprocessData = (data: Institution[]): Institution[] => {
  return data.filter(inst => {
    // Remove entries with null/NaN in critical fields
    return inst !== null &&
           !isNaN(inst.latitude) &&
           !isNaN(inst.longitude) &&
           inst.inst_name !== null &&
           inst.unitid !== null &&
           inst.zip !== null;
  });
};

export const cleanInstitutionData = (data: Institution[]): Institution[] => {
  // First preprocess to remove null/NaN entries
  const preprocessed = preprocessData(data);
  
  return preprocessed.filter(inst => (
    isValidCoordinate(inst.latitude, inst.longitude) &&
    inst.inst_name &&
    inst.unitid &&
    isValidZipCode(inst.zip)
  )).map(inst => ({
    ...inst,
    zip: (inst.zip || "").substring(0, 5),
    number_applied: isNaN(inst.number_applied) ? 0 : inst.number_applied,
    number_admitted: isNaN(inst.number_admitted) ? 0 : inst.number_admitted,
    number_enrolled_total: isNaN(inst.number_enrolled_total) ? 0 : inst.number_enrolled_total,
    admit_rate: calculateAdmitRate(inst.number_admitted, inst.number_applied),
    yield_rate: calculateYieldRate(inst.number_enrolled_total, inst.number_admitted),
    sum_average_amount: isNaN(inst.sum_average_amount) ? 0 : inst.sum_average_amount,
    sum_total_amount: isNaN(inst.sum_total_amount) ? 0 : inst.sum_total_amount,
    percent_of_students: isNaN(inst.percent_of_students) ? 0 : inst.percent_of_students,
    bach_home_zip_pct: isNaN(inst.bach_home_zip_pct) ? null : inst.bach_home_zip_pct,
    hhinc_home_zip_med: isNaN(inst.hhinc_home_zip_med) ? null : inst.hhinc_home_zip_med,
    poverty_rate_home_zip: isNaN(inst.poverty_rate_home_zip) ? null : inst.poverty_rate_home_zip,
    cc_basic_2021: inst.cc_basic_2021 || 0
  }));
};

const calculateAdmitRate = (admitted: number, applied: number): number => {
  if (applied === 0 || isNaN(applied) || isNaN(admitted)) return 0;
  return admitted / applied;
};

const calculateYieldRate = (enrolled: number, admitted: number): number => {
  if (admitted === 0 || isNaN(admitted) || isNaN(enrolled)) return 0;
  return enrolled / admitted;
};

const isValidCoordinate = (lat: number, lng: number): boolean => {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

const isValidZipCode = (zip: string): boolean => {
  return /^\d{5}/.test(zip);
};