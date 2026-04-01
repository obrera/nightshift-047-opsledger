import type {
  ApprovalDecisionPayload,
  ApprovalRequestPayload,
  DashboardData,
  DeploymentWindow,
  ItemDetail,
  ItemPayload,
  ItemSummary,
  WindowPayload,
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

export function getItems() {
  return request<ItemSummary[]>("/api/items");
}

export function getItem(id: number) {
  return request<ItemDetail>(`/api/items/${id}`);
}

export function createItem(payload: ItemPayload) {
  return request<ItemDetail>("/api/items", { method: "POST", body: JSON.stringify(payload) });
}

export function updateItem(id: number, payload: ItemPayload) {
  return request<ItemDetail>(`/api/items/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteItem(id: number) {
  return request<{ ok: true }>(`/api/items/${id}`, { method: "DELETE" });
}

export function requestApproval(itemId: number, payload: ApprovalRequestPayload) {
  return request<ItemDetail>(`/api/items/${itemId}/approvals`, { method: "POST", body: JSON.stringify(payload) });
}

export function decideApproval(itemId: number, approvalId: number, payload: ApprovalDecisionPayload) {
  return request<ItemDetail>(`/api/items/${itemId}/approvals/${approvalId}/decision`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getWindows() {
  return request<DeploymentWindow[]>("/api/windows");
}

export function createWindow(payload: WindowPayload) {
  return request<DeploymentWindow[]>("/api/windows", { method: "POST", body: JSON.stringify(payload) });
}

export function updateWindow(id: number, payload: WindowPayload) {
  return request<DeploymentWindow[]>(`/api/windows/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteWindow(id: number) {
  return request<DeploymentWindow[]>(`/api/windows/${id}`, { method: "DELETE" });
}
