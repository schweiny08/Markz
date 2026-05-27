import SQLite from 'react-native-sqlite-storage';
import { TestTemplate, TestSession, StudentRecord } from '../types';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) { return db; }
  db = await SQLite.openDatabase({ name: 'markz.db', location: 'default' });
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subjects TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      template_name TEXT NOT NULL,
      subjects TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      roll_number INTEGER NOT NULL,
      marks TEXT NOT NULL,
      total_marks REAL NOT NULL,
      percentage REAL NOT NULL,
      grade TEXT NOT NULL,
      grade_label TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  return db;
}

export async function saveTemplate(template: TestTemplate): Promise<void> {
  const d = await getDb();
  await d.executeSql(
    'INSERT OR REPLACE INTO templates (id, name, subjects, created_at) VALUES (?, ?, ?, ?)',
    [template.id, template.name, JSON.stringify(template.subjects), template.createdAt],
  );
}

export async function getTemplates(): Promise<TestTemplate[]> {
  const d = await getDb();
  const [result] = await d.executeSql(
    'SELECT * FROM templates ORDER BY created_at DESC',
  );
  const rows: TestTemplate[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i);
    rows.push({
      id: row.id,
      name: row.name,
      subjects: JSON.parse(row.subjects),
      createdAt: row.created_at,
    });
  }
  return rows;
}

export async function deleteTemplate(id: string): Promise<void> {
  const d = await getDb();
  await d.executeSql('DELETE FROM templates WHERE id = ?', [id]);
}

export async function createSession(session: TestSession): Promise<void> {
  const d = await getDb();
  await d.executeSql(
    'INSERT INTO sessions (id, template_id, template_name, subjects, created_at) VALUES (?, ?, ?, ?, ?)',
    [session.id, session.templateId, session.templateName,
     JSON.stringify(session.subjects), session.createdAt],
  );
}

export async function saveRecord(record: StudentRecord): Promise<void> {
  const d = await getDb();
  await d.executeSql(
    `INSERT OR REPLACE INTO records
     (id, session_id, roll_number, marks, total_marks, percentage, grade, grade_label, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [record.id, record.sessionId, record.rollNumber, JSON.stringify(record.marks),
     record.totalMarks, record.percentage, record.grade, record.gradeLabel, Date.now()],
  );
}

export async function getSessionRecords(sessionId: string): Promise<StudentRecord[]> {
  const d = await getDb();
  const [result] = await d.executeSql(
    'SELECT * FROM records WHERE session_id = ? ORDER BY roll_number ASC',
    [sessionId],
  );
  const rows: StudentRecord[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i);
    rows.push({
      id: row.id,
      sessionId: row.session_id,
      rollNumber: row.roll_number,
      marks: JSON.parse(row.marks),
      totalMarks: row.total_marks,
      percentage: row.percentage,
      grade: row.grade,
      gradeLabel: row.grade_label,
    });
  }
  return rows;
}

export async function getSessions(): Promise<TestSession[]> {
  const d = await getDb();
  const [result] = await d.executeSql(
    'SELECT * FROM sessions ORDER BY created_at DESC',
  );
  const rows: TestSession[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i);
    rows.push({
      id: row.id,
      templateId: row.template_id,
      templateName: row.template_name,
      subjects: JSON.parse(row.subjects),
      createdAt: row.created_at,
    });
  }
  return rows;
}
