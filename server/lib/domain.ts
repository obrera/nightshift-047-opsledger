import type {
  ApprovalDecisionRow,
  ApprovalRequestRow,
  DeploymentWindowRow,
  LedgerItemRow,
} from "../db/schema";

export function isOpenStatus(status: LedgerItemRow["status"]) {
  return status !== "resolved" && status !== "closed";
}

export function summarizeApprovals(
  approvals: ApprovalRequestRow[],
  decisions: ApprovalDecisionRow[],
  itemId: number,
) {
  const itemApprovals = approvals.filter((approval) => approval.itemId === itemId);
  const itemDecisions = decisions.filter((decision) =>
    itemApprovals.some((approval) => approval.id === decision.approvalId),
  );

  return {
    approvals: itemApprovals.map((approval) => ({
      ...approval,
      history: itemDecisions
        .filter((decision) => decision.approvalId === approval.id)
        .sort((a, b) => b.decidedAt.getTime() - a.decidedAt.getTime()),
    })),
    pendingApprovalCount: itemApprovals.filter((approval) => approval.status === "pending").length,
    lastDecisionAt: itemDecisions
      .sort((a, b) => b.decidedAt.getTime() - a.decidedAt.getTime())[0]
      ?.decidedAt,
  };
}

export function detectWindowConflicts(
  windows: DeploymentWindowRow[],
  items: LedgerItemRow[],
  targetWindow?: DeploymentWindowRow,
) {
  return windows.map((window) => {
    const current = targetWindow?.id === window.id ? targetWindow : window;
    const overlappingWindows = windows
      .filter((candidate) => candidate.id !== current.id && candidate.status !== "cancelled")
      .filter(
        (candidate) =>
          current.startAt.getTime() < candidate.endAt.getTime() &&
          current.endAt.getTime() > candidate.startAt.getTime(),
      )
      .map((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        startAt: candidate.startAt,
        endAt: candidate.endAt,
        environment: candidate.environment,
      }));

    const openItems = items
      .filter((item) => isOpenStatus(item.status))
      .filter((item) => {
        if (!item.dueDate) {
          return item.priority === "critical" || item.priority === "high";
        }
        return item.dueDate.getTime() <= current.endAt.getTime();
      })
      .map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        priority: item.priority,
        dueDate: item.dueDate,
      }));

    return {
      ...current,
      warnings: [
        ...overlappingWindows.map((overlap) => ({
          type: "overlap" as const,
          message: `Overlaps ${overlap.title} in ${overlap.environment}.`,
          relatedId: overlap.id,
        })),
        ...openItems.map((item) => ({
          type: "open-item" as const,
          message: `Open ${item.priority} ${item.status} item: ${item.title}.`,
          relatedId: item.id,
        })),
      ],
    };
  });
}
