import { Subject, StudentRecord } from '../types';
import { getGradeInfo } from '../constants/grades';

export function computeRecord(
  id: string,
  sessionId: string,
  rollNumber: number,
  marks: (number | null)[],
  subjects: Subject[],
): StudentRecord {
  let totalMarks = 0;
  let totalMaxMarks = 0;

  marks.forEach((m, i) => {
    const maxM = subjects[i]?.maxMarks ?? 100;
    totalMaxMarks += maxM;
    if (m !== null) {
      totalMarks += m;
    }
  });

  const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
  const info = getGradeInfo(percentage);

  return {
    id,
    sessionId,
    rollNumber,
    marks,
    totalMarks,
    percentage,
    grade: info.grade,
    gradeLabel: info.label,
  };
}

export function buildTTSResult(record: StudentRecord): string {
  return `Total ${record.totalMarks}. Grade ${record.grade}. Roll ${record.rollNumber + 1}?`;
}

export function validateMark(value: number, subject: Subject): string | null {
  if (value < 0) {
    return `Invalid marks for ${subject.name}. Marks cannot be negative.`;
  }
  if (value > subject.maxMarks) {
    return `Invalid marks for ${subject.name}. Maximum is ${subject.maxMarks}. Please repeat.`;
  }
  return null;
}
