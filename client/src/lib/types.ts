export type ReleaseStatus = "planning" | "at-risk" | "blocked" | "ready" | "shipped";
export type TimelineKind = "blocker" | "note" | "status" | "decision";

export interface ReleasePayload {
  name: string;
  owner: string;
  status: ReleaseStatus;
  riskScore: number;
  targetDate: string;
  summary: string;
  scope: string;
}

export interface ChecklistPayload {
  title: string;
  category: string;
  assignee: string;
}

export interface TimelinePayload {
  kind: TimelineKind;
  body: string;
  actor: string;
}

export interface ChecklistItem {
  id: number;
  releaseId: number;
  title: string;
  category: string;
  assignee: string;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface TimelineEntry {
  id: number;
  releaseId: number;
  kind: TimelineKind;
  body: string;
  actor: string;
  createdAt: string;
}

export interface ReleaseSummary {
  id: number;
  name: string;
  owner: string;
  status: ReleaseStatus;
  riskScore: number;
  targetDate: string;
  summary: string;
  scope: string;
  createdAt: string;
  updatedAt: string;
  blockerCount: number;
  checklistCompletion: number;
  openChecklistCount: number;
}

export interface ReleaseDetail {
  id: number;
  name: string;
  owner: string;
  status: ReleaseStatus;
  riskScore: number;
  targetDate: string;
  summary: string;
  scope: string;
  createdAt: string;
  updatedAt: string;
  blockerCount: number;
  checklistCompletion: number;
  checklist: ChecklistItem[];
  timeline: TimelineEntry[];
}

export interface DashboardData {
  metrics: {
    total: number;
    ready: number;
    blocked: number;
    highRisk: number;
    dueSoon: number;
    checklistCompletion: number;
  };
  owners: Array<{ owner: string; count: number }>;
  spotlight: Array<{
    id: number;
    name: string;
    owner: string;
    status: ReleaseStatus;
    riskScore: number;
    targetDate: string;
    blockerCount: number;
  }>;
}
