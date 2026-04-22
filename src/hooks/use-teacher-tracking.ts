'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Group, OfficialGroup } from '@/lib/placeholder-data';

export const TEACHER_TRACKING_STORAGE_KEY = 'academic_tracker_teacher_logs';
export const TEACHER_TRACKING_MANUAL_TEACHERS_KEY = 'academic_tracker_teacher_catalog';
export const TEACHER_TRACKING_SCHEDULES_KEY = 'academic_tracker_teacher_schedules';

export type TeacherIncidentStatus = 'puntual' | 'retardo' | 'falta' | 'salida_anticipada';

export type TeacherTrackingGroup = {
  id: string;
  label: string;
  source: 'official' | 'platform';
};

export type TeacherAssignment = {
  groupId: string;
  groupLabel: string;
  subject: string;
};

export type TeacherDirectoryEntry = {
  id: string;
  name: string;
  email: string;
  source: 'platform' | 'manual';
  assignments: TeacherAssignment[];
  createdAt?: string;
  updatedAt?: string;
};

export type TeacherScheduleBlock = {
  id: string;
  groupId: string;
  groupLabel: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId?: string;
  teacherName: string;
  teacherEmail?: string;
  createdAt: string;
  updatedAt: string;
};

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
  groupId?: string;
  groupLabel?: string;
  subject?: string;
  scheduleBlockId?: string;
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
  groupId?: string;
  groupLabel?: string;
  subject?: string;
  scheduleBlockId?: string;
};

export type CreateManualTeacherInput = {
  teacherName: string;
  teacherEmail?: string;
  groupId: string;
  groupLabel: string;
  subject: string;
};

export type CreateManualTeacherBatchInput = CreateManualTeacherInput[];

export type CreateScheduleBlockInput = {
  groupId: string;
  groupLabel: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId?: string;
  teacherName: string;
  teacherEmail?: string;
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeTeacherId(name: string, email?: string) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (normalizedEmail) {
    return `teacher:${normalizedEmail}`;
  }

  return `teacher:${name.trim().toLowerCase().replace(/\s+/g, '-')}`;
}

function mergeAssignments(existing: TeacherAssignment[], next: TeacherAssignment[]) {
  const map = new Map<string, TeacherAssignment>();

  [...existing, ...next].forEach((assignment) => {
    map.set(`${assignment.groupId}__${assignment.subject.toLowerCase()}`, assignment);
  });

  return Array.from(map.values()).sort((a, b) => a.groupLabel.localeCompare(b.groupLabel) || a.subject.localeCompare(b.subject));
}

function buildSchedulableGroups(platformGroups: Group[], officialGroups: OfficialGroup[]): TeacherTrackingGroup[] {
  const map = new Map<string, TeacherTrackingGroup>();

  officialGroups.forEach((group) => {
    map.set(group.id, {
      id: group.id,
      label: group.name,
      source: 'official',
    });
  });

  platformGroups.forEach((group) => {
    if (group.officialGroupId && map.has(group.officialGroupId)) {
      return;
    }

    const label = [group.semester, group.groupName].filter(Boolean).join(' ').trim() || group.subject;
    map.set(`platform:${group.id}`, {
      id: `platform:${group.id}`,
      label,
      source: 'platform',
    });
  });

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function buildPlatformTeachers(platformGroups: Group[], officialGroups: OfficialGroup[]): TeacherDirectoryEntry[] {
  const officialGroupMap = new Map(officialGroups.map((group) => [group.id, group.name]));
  const teacherMap = new Map<string, TeacherDirectoryEntry>();

  platformGroups.forEach((group) => {
    const facilitator = (group.facilitator || '').trim();
    if (!facilitator) {
      return;
    }

    const teacherId = normalizeTeacherId(facilitator);
    const groupId = group.officialGroupId && officialGroupMap.has(group.officialGroupId)
      ? group.officialGroupId
      : `platform:${group.id}`;
    const groupLabel = group.officialGroupId && officialGroupMap.has(group.officialGroupId)
      ? officialGroupMap.get(group.officialGroupId) || group.subject
      : ([group.semester, group.groupName].filter(Boolean).join(' ').trim() || group.subject);

    const assignment: TeacherAssignment = {
      groupId,
      groupLabel,
      subject: group.subject,
    };

    const existing = teacherMap.get(teacherId);
    if (existing) {
      existing.assignments = mergeAssignments(existing.assignments, [assignment]);
      return;
    }

    teacherMap.set(teacherId, {
      id: teacherId,
      name: facilitator,
      email: '',
      source: 'platform',
      assignments: [assignment],
    });
  });

  return Array.from(teacherMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function useTeacherTracking(platformGroups: Group[] = [], officialGroups: OfficialGroup[] = []) {
  const [logs, setLogs] = useState<TeacherTrackingLog[]>([]);
  const [manualTeachers, setManualTeachers] = useState<TeacherDirectoryEntry[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<TeacherScheduleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setLogs(readStorage<TeacherTrackingLog[]>(TEACHER_TRACKING_STORAGE_KEY, []));
    setManualTeachers(readStorage<TeacherDirectoryEntry[]>(TEACHER_TRACKING_MANUAL_TEACHERS_KEY, []));
    setScheduleBlocks(readStorage<TeacherScheduleBlock[]>(TEACHER_TRACKING_SCHEDULES_KEY, []));
    setIsLoading(false);
  }, []);

  const persistLogs = useCallback((nextLogs: TeacherTrackingLog[]) => {
    setLogs(nextLogs);
    writeStorage(TEACHER_TRACKING_STORAGE_KEY, nextLogs);
  }, []);

  const persistManualTeachers = useCallback((nextTeachers: TeacherDirectoryEntry[]) => {
    setManualTeachers(nextTeachers);
    writeStorage(TEACHER_TRACKING_MANUAL_TEACHERS_KEY, nextTeachers);
  }, []);

  const persistScheduleBlocks = useCallback((nextBlocks: TeacherScheduleBlock[]) => {
    setScheduleBlocks(nextBlocks);
    writeStorage(TEACHER_TRACKING_SCHEDULES_KEY, nextBlocks);
  }, []);

  const syncedGroups = useMemo(() => buildSchedulableGroups(platformGroups, officialGroups), [platformGroups, officialGroups]);
  const platformTeachers = useMemo(() => buildPlatformTeachers(platformGroups, officialGroups), [platformGroups, officialGroups]);

  const teacherDirectory = useMemo(() => {
    const map = new Map<string, TeacherDirectoryEntry>();

    [...platformTeachers, ...manualTeachers].forEach((teacher) => {
      const teacherId = teacher.id || normalizeTeacherId(teacher.name, teacher.email);
      const existing = map.get(teacherId);

      if (existing) {
        map.set(teacherId, {
          ...existing,
          name: existing.name || teacher.name,
          email: existing.email || teacher.email,
          source: existing.source === 'manual' || teacher.source === 'manual' ? 'manual' : 'platform',
          assignments: mergeAssignments(existing.assignments, teacher.assignments),
          updatedAt: teacher.updatedAt || existing.updatedAt,
        });
        return;
      }

      map.set(teacherId, {
        ...teacher,
        id: teacherId,
        assignments: [...teacher.assignments],
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [manualTeachers, platformTeachers]);

  const subjectCatalog = useMemo(() => {
    const subjects = new Set<string>();

    platformGroups.forEach((group) => {
      if (group.subject) {
        subjects.add(group.subject);
      }
    });

    teacherDirectory.forEach((teacher) => {
      teacher.assignments.forEach((assignment) => {
        if (assignment.subject) {
          subjects.add(assignment.subject);
        }
      });
    });

    scheduleBlocks.forEach((block) => {
      if (block.subject) {
        subjects.add(block.subject);
      }
    });

    return Array.from(subjects).sort((a, b) => a.localeCompare(b));
  }, [platformGroups, teacherDirectory, scheduleBlocks]);

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
      groupId: input.groupId,
      groupLabel: input.groupLabel,
      subject: input.subject,
      scheduleBlockId: input.scheduleBlockId,
    };

    const nextLogs = [newLog, ...logs].sort((a, b) => `${b.incidentDate}${b.createdAt}`.localeCompare(`${a.incidentDate}${a.createdAt}`));
    persistLogs(nextLogs);
    return newLog;
  }, [logs, persistLogs]);

  const deleteLog = useCallback((logId: string) => {
    persistLogs(logs.filter((log) => log.id !== logId));
  }, [logs, persistLogs]);

  const addManualTeacher = useCallback((input: CreateManualTeacherInput) => {
    const teacherId = normalizeTeacherId(input.teacherName, input.teacherEmail);
    const timestamp = new Date().toISOString();
    const assignment: TeacherAssignment = {
      groupId: input.groupId,
      groupLabel: input.groupLabel,
      subject: input.subject.trim(),
    };

    const existing = manualTeachers.find((teacher) => teacher.id === teacherId);
    let nextTeachers: TeacherDirectoryEntry[];

    if (existing) {
      nextTeachers = manualTeachers.map((teacher) => teacher.id === teacherId ? {
        ...teacher,
        name: input.teacherName.trim(),
        email: (input.teacherEmail || '').trim().toLowerCase(),
        assignments: mergeAssignments(teacher.assignments, [assignment]),
        updatedAt: timestamp,
      } : teacher);
    } else {
      nextTeachers = [
        {
          id: teacherId,
          name: input.teacherName.trim(),
          email: (input.teacherEmail || '').trim().toLowerCase(),
          source: 'manual',
          assignments: [assignment],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        ...manualTeachers,
      ];
    }

    persistManualTeachers(nextTeachers);
    return teacherId;
  }, [manualTeachers, persistManualTeachers]);

  const addManualTeachersBatch = useCallback((inputs: CreateManualTeacherBatchInput) => {
    if (inputs.length === 0) {
      return 0;
    }

    const timestamp = new Date().toISOString();
    let nextTeachers = [...manualTeachers];

    inputs.forEach((input) => {
      const teacherId = normalizeTeacherId(input.teacherName, input.teacherEmail);
      const assignment: TeacherAssignment = {
        groupId: input.groupId,
        groupLabel: input.groupLabel,
        subject: input.subject.trim(),
      };

      const existing = nextTeachers.find((teacher) => teacher.id === teacherId);
      if (existing) {
        nextTeachers = nextTeachers.map((teacher) => teacher.id === teacherId ? {
          ...teacher,
          name: input.teacherName.trim(),
          email: (input.teacherEmail || '').trim().toLowerCase(),
          assignments: mergeAssignments(teacher.assignments, [assignment]),
          updatedAt: timestamp,
        } : teacher);
      } else {
        nextTeachers = [
          {
            id: teacherId,
            name: input.teacherName.trim(),
            email: (input.teacherEmail || '').trim().toLowerCase(),
            source: 'manual',
            assignments: [assignment],
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          ...nextTeachers,
        ];
      }
    });

    persistManualTeachers(nextTeachers);
    return inputs.length;
  }, [manualTeachers, persistManualTeachers]);

  const addScheduleBlock = useCallback((input: CreateScheduleBlockInput) => {
    const timestamp = new Date().toISOString();
    const nextBlock: TeacherScheduleBlock = {
      id: `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      groupId: input.groupId,
      groupLabel: input.groupLabel,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      subject: input.subject.trim(),
      teacherId: input.teacherId,
      teacherName: input.teacherName.trim(),
      teacherEmail: (input.teacherEmail || '').trim().toLowerCase(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const nextBlocks = [...scheduleBlocks, nextBlock].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.startTime.localeCompare(b.startTime);
    });
    persistScheduleBlocks(nextBlocks);
    return nextBlock;
  }, [persistScheduleBlocks, scheduleBlocks]);

  const deleteScheduleBlock = useCallback((blockId: string) => {
    persistScheduleBlocks(scheduleBlocks.filter((block) => block.id !== blockId));
  }, [persistScheduleBlocks, scheduleBlocks]);

  const updateScheduleBlock = useCallback((blockId: string, updates: Partial<Omit<TeacherScheduleBlock, 'id' | 'createdAt'>>) => {
    const timestamp = new Date().toISOString();
    const nextBlocks = scheduleBlocks.map((block) =>
      block.id === blockId ? { ...block, ...updates, updatedAt: timestamp } : block,
    ).sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || a.startTime.localeCompare(b.startTime));
    persistScheduleBlocks(nextBlocks);
  }, [persistScheduleBlocks, scheduleBlocks]);

  const updateLog = useCallback((logId: string, updates: Partial<Omit<TeacherTrackingLog, 'id' | 'createdAt'>>) => {
    const timestamp = new Date().toISOString();
    persistLogs(logs.map((log) =>
      log.id === logId ? { ...log, ...updates, updatedAt: timestamp } : log,
    ));
  }, [logs, persistLogs]);

  const todayDayOfWeek = new Date().getDay();

  const todaySchedule = useMemo(() => {
    return scheduleBlocks
      .filter((block) => block.dayOfWeek === todayDayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [scheduleBlocks, todayDayOfWeek]);

  const groupsWithoutScheduleToday = useMemo(() => {
    const scheduledGroups = new Set(todaySchedule.map((block) => block.groupId));
    return syncedGroups.filter((group) => !scheduledGroups.has(group.id));
  }, [syncedGroups, todaySchedule]);

  const getSchedulesForGroup = useCallback((groupId: string) => {
    return scheduleBlocks
      .filter((block) => block.groupId === groupId)
      .sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || a.startTime.localeCompare(b.startTime));
  }, [scheduleBlocks]);

  return {
    isLoading,
    logs,
    manualTeachers,
    scheduleBlocks,
    syncedGroups,
    teacherDirectory,
    subjectCatalog,
    todaySchedule,
    groupsWithoutScheduleToday,
    addLog,
    deleteLog,
    updateLog,
    addManualTeacher,
    addManualTeachersBatch,
    addScheduleBlock,
    deleteScheduleBlock,
    updateScheduleBlock,
    getSchedulesForGroup,
  };
}
