export interface Subject {
  id: string;
  name: string;
  maxMarks: number;
}

export interface TestTemplate {
  id: string;
  name: string;
  subjects: Subject[];
  createdAt: number;
}

export interface StudentRecord {
  id: string;
  sessionId: string;
  rollNumber: number;
  marks: (number | null)[];
  totalMarks: number;
  percentage: number;
  grade: string;
  gradeLabel: string;
}

export interface TestSession {
  id: string;
  templateId: string;
  templateName: string;
  subjects: Subject[];
  createdAt: number;
}

export type VoiceCommand =
  | { type: 'ROLL'; rollNumber: number }
  | { type: 'MARKS'; values: (number | null)[] }
  | { type: 'CORRECT' }
  | { type: 'DONE' }
  | { type: 'UNKNOWN'; raw: string };
