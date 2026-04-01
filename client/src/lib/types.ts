export type ItemType = "incident" | "change";
export type ItemStatus = "open" | "planned" | "in-progress" | "blocked" | "resolved" | "closed";
export type Priority = "low" | "medium" | "high" | "critical";
export type ApprovalState = "pending" | "approved" | "rejected";
export type ApprovalDecision = "requested" | "approved" | "rejected";
export type WindowEnvironment = "production" | "staging" | "sandbox";
export type WindowStatus = "planned" | "approved" | "active" | "completed" | "cancelled";

export interface ItemPayload {
  itemType: ItemType;
  title: string;
  service: string;
  description: string;
  status: ItemStatus;
  priority: Priority;
  owner: string;
  dueDate: string | null;
  impactSummary: string;
}

export interface ApprovalRequestPayload {
  reviewer: string;
  comment: string;
}

export interface ApprovalDecisionPayload {
  decision: "approved" | "rejected";
  reviewer: string;
  comment: string;
}

export interface WindowPayload {
  title: string;
  environment: WindowEnvironment;
  owner: string;
  status: WindowStatus;
  startAt: string;
  endAt: string;
  notes: string;
}

export interface DecisionHistoryEntry {
  id: number;
  approvalId: number;
  reviewer: string;
  decision: ApprovalDecision;
  comment: string | null;
  decidedAt: string;
}

export interface ApprovalRequest {
  id: number;
  itemId: number;
  reviewer: string;
  status: ApprovalState;
  latestComment: string | null;
  createdAt: string;
  updatedAt: string;
  history: DecisionHistoryEntry[];
}

export interface ItemSummary {
  id: number;
  itemType: ItemType;
  title: string;
  service: string;
  description: string;
  status: ItemStatus;
  priority: Priority;
  owner: string;
  dueDate: string | null;
  impactSummary: string;
  createdAt: string;
  updatedAt: string;
  pendingApprovalCount: number;
  lastDecisionAt?: string | null;
}

export interface ItemDetail extends ItemSummary {
  approvals: ApprovalRequest[];
}

export interface WindowWarning {
  type: "overlap" | "open-item";
  message: string;
  relatedId: number;
}

export interface DeploymentWindow {
  id: number;
  title: string;
  environment: WindowEnvironment;
  owner: string;
  status: WindowStatus;
  startAt: string;
  endAt: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  warnings: WindowWarning[];
}

export interface DashboardData {
  metrics: {
    trackedItems: number;
    openItems: number;
    approvalsPending: number;
    windowConflicts: number;
    dueThisWeek: number;
  };
  statusBreakdown: Array<{ label: ItemStatus; value: number }>;
  priorityBreakdown: Array<{ label: Priority; value: number }>;
  trend: Array<{ label: string; created: number; decisions: number; completed: number }>;
  spotlight: Array<{
    id: number;
    title: string;
    itemType: ItemType;
    service: string;
    status: ItemStatus;
    priority: Priority;
    owner: string;
    dueDate: string | null;
    pendingApprovalCount: number;
  }>;
  windows: DeploymentWindow[];
}
