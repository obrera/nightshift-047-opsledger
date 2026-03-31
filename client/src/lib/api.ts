import type {
  ChecklistPayload,
  DashboardData,
  ReleaseDetail,
  ReleasePayload,
  ReleaseSummary,
  TimelinePayload,
} from "./types";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getDashboard() {
  return request<DashboardData>("/api/dashboard");
}

export function getReleases(query = "") {
  return request<ReleaseSummary[]>(`/api/releases${query}`);
}

export function getRelease(id: number) {
  return request<ReleaseDetail>(`/api/releases/${id}`);
}

export function createRelease(payload: ReleasePayload) {
  return request<ReleaseDetail>("/api/releases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRelease(id: number, payload: ReleasePayload) {
  return request<ReleaseDetail>(`/api/releases/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function addChecklistItem(id: number, payload: ChecklistPayload) {
  return request<ReleaseDetail>(`/api/releases/${id}/checklist`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateChecklistItem(id: number, itemId: number, completed: boolean) {
  return request<ReleaseDetail>(`/api/releases/${id}/checklist/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}

export function addTimelineEntry(id: number, payload: TimelinePayload) {
  return request<ReleaseDetail>(`/api/releases/${id}/timeline`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
