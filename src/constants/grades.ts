export interface GradeInfo {
  min: number;
  grade: string;
  label: string;
  textColor: string;
  bgColor: string;
}

// Karnataka State Board KSEEB grading scale
export const GRADE_THRESHOLDS: GradeInfo[] = [
  { min: 90, grade: 'A+', label: 'Outstanding',  textColor: '#FFFFFF', bgColor: '#1B5E20' },
  { min: 75, grade: 'A',  label: 'Distinction',  textColor: '#FFFFFF', bgColor: '#2E7D32' },
  { min: 60, grade: 'B+', label: 'First Class',  textColor: '#000000', bgColor: '#8BC34A' },
  { min: 45, grade: 'B',  label: 'Second Class', textColor: '#000000', bgColor: '#CDDC39' },
  { min: 33, grade: 'C',  label: 'Pass',         textColor: '#000000', bgColor: '#FFA726' },
  { min: 0,  grade: 'F',  label: 'Fail',         textColor: '#FFFFFF', bgColor: '#C62828' },
];

export function getGradeInfo(percentage: number): GradeInfo {
  return (
    GRADE_THRESHOLDS.find(t => percentage >= t.min) ??
    GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1]
  );
}
