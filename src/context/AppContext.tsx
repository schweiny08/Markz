import React, { createContext, useContext, useState, useCallback } from 'react';
import { TestTemplate, TestSession, StudentRecord } from '../types';
import * as DB from '../services/DatabaseService';

interface AppContextValue {
  templates: TestTemplate[];
  sessions: TestSession[];
  loadTemplates: () => Promise<void>;
  loadSessions: () => Promise<void>;
  saveTemplate: (t: TestTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  startSession: (s: TestSession) => Promise<void>;
  saveRecord: (r: StudentRecord) => Promise<void>;
  getSessionRecords: (sessionId: string) => Promise<StudentRecord[]>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [sessions, setSessions] = useState<TestSession[]>([]);

  const loadTemplates = useCallback(async () => {
    const t = await DB.getTemplates();
    setTemplates(t);
  }, []);

  const loadSessions = useCallback(async () => {
    const s = await DB.getSessions();
    setSessions(s);
  }, []);

  const saveTemplate = useCallback(async (t: TestTemplate) => {
    await DB.saveTemplate(t);
    await loadTemplates();
  }, [loadTemplates]);

  const deleteTemplate = useCallback(async (id: string) => {
    await DB.deleteTemplate(id);
    await loadTemplates();
  }, [loadTemplates]);

  const startSession = useCallback(async (s: TestSession) => {
    await DB.createSession(s);
    await loadSessions();
  }, [loadSessions]);

  const saveRecord = useCallback(async (r: StudentRecord) => {
    await DB.saveRecord(r);
  }, []);

  const getSessionRecords = useCallback(
    (sessionId: string) => DB.getSessionRecords(sessionId),
    [],
  );

  return (
    <AppContext.Provider value={{
      templates, sessions,
      loadTemplates, loadSessions,
      saveTemplate, deleteTemplate,
      startSession, saveRecord, getSessionRecords,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) { throw new Error('useApp must be used within AppProvider'); }
  return ctx;
}
