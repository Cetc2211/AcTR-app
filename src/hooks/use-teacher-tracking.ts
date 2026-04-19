'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export const TEACHER_TRACKING_STORAGE_KEY = 'academic_tracker_teacher_logs';

export type TeacherIncidentStatus = 'puntual' | 'retardo' | 'falta' | 'salida_anticipada';

export type TeacherTrackingLog = {
  id: string;
  teacherName: string;
  teacherEmail: string;
  incidentDate: string;
  status: TeacherIncidentStatus;
  delayTime?: string;
  earlyExitTime?: string;
  institutionalNotes: string;
  createdAt: string;
  updatedAt: string;
  reportedBy?: string;
};

export type CreateTeacherTrackingLogInput = {
  teacherName: string;
  teacherEmail?: string;
  incidentDate: string;
  status: TeacherIncidentStatus;
  delayTime?: string;
  earlyExitTime?: string;
  institutionalNotes?: string;
  reportedBy?: string;
};

function readTeacherLogs(): TeacherTrackingLog[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(TEACHER_TRACKING_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading teacher tracking logs:', error);
    return [];
  }
}

function writeTeacherLogs(logs: TeacherTrackingLog[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TEACHER_TRACKING_STORAGE_KEY, JSON.stringify(logs));
}

export function useTeacherTracking() {
  const [logs, setLogs] = useState<TeacherTrackingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setLogs(readTeacherLogs());
    setIsLoading(false);
  }, []);

  const persistLogs = useCallback((nextLogs: TeacherTrackingLog[]) => {
    setLogs(nextLogs);
    writeTeacherLogs(nextLogs);
  }, []);

  const addLog = useCallback((input: CreateTeacherTrackingLogInput) => {
    const timestamp = new Date().toISOString();
    const newLog: TeacherTrackingLog = {
      id: `teacher-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      teacherName: input.teacherName.trim(),
      teacherEmail: (input.teacherEmail || '').trim().toLowerCase(),
      incidentDate: input.incidentDate,
      status: input.status,
      delayTime: input.status === 'retardo' ? input.delayTime || '' : '',
      earlyExitTime: input.status === 'salida_anticipada' ? input.earlyExitTime || '' : '',
      institutionalNotes: (input.institutionalNotes || '').trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
      reportedBy: input.reportedBy,
    };

    const nextLogs = [newLog, ...logs].sort((a, b) => b.incidentDate.localeCompare(a.incidentDate));
    persistLogs(nextLogs);
    return newLog;
  }, [logs, persistLogs]);

  const deleteLog = useCallback((logId: string) => {
    const nextLogs = logs.filter((log) => log.id !== logId);
    persistLogs(nextLogs);
  }, [logs, persistLogs]);

  const updateLog = useCallback((logId: string, updates: Partial<CreateTeacherTrackingLogInput>) => {
    const nextLogs = logs.map((log) => {
      if (log.id !== logId) {
        return log;
      }

      const nextStatus = updates.status || log.status;
      return {
        ...log,
        teacherName: updates.teacherName !== undefined ? updates.teacherName.trim() : log.teacherName,
        teacherEmail: updates.teacherEmail !== undefined ? updates.teacherEmail.trim().toLowerCase() : log.teacherEmail,
        incidentDate: updates.incidentDate || log.incidentDate,
        status: nextStatus,
        delayTime: nextStatus === 'retardo' ? updates.delayTime ?? log.delayTime ?? '' : '',
        earlyExitTime: nextStatus === 'salida_anticipada' ? updates.earlyExitTime ?? log.earlyExitTime ?? '' : '',
        institutionalNotes: updates.institutionalNotes !== undefined ? updates.institutionalNotes.trim() : log.institutionalNotes,
        updatedAt: new Date().toISOString(),
        reportedBy: updates.reportedBy !== undefined ? updates.reportedBy : log.reportedBy,
      };
    });

    persistLogs(nextLogs);
  }, [logs, persistLogs]);

  const uniqueTeacherNames = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.teacherName).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  return {
    logs,
    isLoading,
    addLog,
    deleteLog,
    updateLog,
    uniqueTeacherNames,
  };
}