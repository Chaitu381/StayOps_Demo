// const DEFAULT_BASE = "http://localhost:381";

const DEFAULT_BASE = "https://stayops-tuul.onrender.com";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || DEFAULT_BASE;

const AUTH_KEY = "fengari.auth";
const PG_KEY = "fengari.selectedPgId";

export interface AuthCreds {
  username: string;
  password: string;
  role: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "WARDEN";

  pgId?: number | string | null;
  ownerId?: number | string | null;
}

export interface AuthCheckResponse {
  status: string;
  username: string;
  role: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "WARDEN";
  pgId?: number | string | null;
  pgName?: string | null;
  pgCode?: string | null;
  location?: string | null;
}

export function loadAuth(): AuthCreds | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthCreds) : null;
  } catch {
    return null;
  }
}

export function saveAuth(creds: AuthCreds) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(creds));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  clearSelectedPgId();
}

export function getSelectedPgId(): string | null {
  return localStorage.getItem(PG_KEY);
}

export function setSelectedPgId(id: string | number) {
  localStorage.setItem(PG_KEY, String(id));
}

export function clearSelectedPgId() {
  localStorage.removeItem(PG_KEY);
}

export function basicAuthHeader(creds: AuthCreds | null): Record<string, string> {
  if (!creds?.username || !creds?.password) return {};

  const token = btoa(`${creds.username}:${creds.password}`);

  return {
    Authorization: `Basic ${token}`,
  };
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  creds?: AuthCreds | null;
  signal?: AbortSignal;
}

function buildUrl(path: string) {
  const cleanBase = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export async function apiRequest<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const creds = opts.creds !== undefined ? opts.creds : loadAuth();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...basicAuthHeader(creds),
  };

  let body: BodyInit | undefined;

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;

  try {
    res = await fetch(buildUrl(path), {
      method: opts.method || "GET",
      headers,
      body,
      signal: opts.signal,
    });
  } catch (e) {
    throw new ApiError(
      `Network error reaching ${API_BASE_URL}. Is the backend running?`,
      0,
      e,
    );
  }

  const text = await res.text();
  let parsed: unknown = null;

  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;

    if (res.status === 401) {
      msg = "Unauthorized. Please login again.";
    } else if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;

      if (typeof obj.message === "string") msg = obj.message;
      else if (typeof obj.error === "string") msg = obj.error;
    } else if (typeof parsed === "string" && parsed) {
      msg = parsed;
    }

    throw new ApiError(msg, res.status, parsed);
  }

  return parsed as T;
}



export async function apiDownload(
  path: string,
  fileName: string,
  opts: RequestOptions = {},
): Promise<void> {
  const creds = opts.creds !== undefined ? opts.creds : loadAuth();

  const headers: Record<string, string> = {
    ...basicAuthHeader(creds),
  };

  const res = await fetch(buildUrl(path), {
    method: opts.method || "GET",
    headers,
    signal: opts.signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(`Download failed (${res.status})`, res.status, text);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function pgScoped(path: string): string {
  const pgId = getSelectedPgId();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!pgId) return cleanPath;

  if (cleanPath.startsWith("/pgs/")) {
    return cleanPath;
  }

  return `/pgs/${encodeURIComponent(pgId)}${cleanPath}`;
}

export const api = {
  // Auth
  verify: (creds: AuthCreds) =>
    apiRequest<AuthCheckResponse>("/auth/check", { creds }),


  // Owners
  listOwners: () => apiRequest<unknown[]>("/owners"),

  createOwner: (body: Record<string, unknown>) =>
    apiRequest("/owners", {
      method: "POST",
      body,
    }),

  updateOwnerSubscription: (
    ownerId: number | string,
    body: {
      subscriptionPlan: string;
      subscriptionActive: boolean;
      subscriptionStartDate: string;
      subscriptionExpiryDate: string;
    },
  ) =>
    apiRequest(`/owners/${ownerId}/subscription`, {
      method: "PATCH",
      body,
    }),

  listOwnerPgs: (ownerId: number | string) =>
    apiRequest<unknown[]>(`/owners/${ownerId}/pgs`),

  createOwnerPg: (ownerId: number | string, body: Record<string, unknown>) =>
    apiRequest(`/owners/${ownerId}/pgs`, {
      method: "POST",
      body,
    }),

  // PG
  listPgs: () => apiRequest<unknown[]>("/pgs"),

  getPgs: () => apiRequest<unknown[]>("/pgs"),

  getPgById: (id: number | string) => apiRequest(`/pgs/${id}`),

  createPg: (body: Record<string, unknown>) =>
    apiRequest("/pgs", {
      method: "POST",
      body,
    }),

  updatePg: (id: number | string, body: Record<string, unknown>) =>
    apiRequest(`/pgs/${id}`, {
      method: "PATCH",
      body,
    }),

  deletePg: (id: number | string) =>
    apiRequest(`/pgs/${id}`, {
      method: "DELETE",
    }),

  // Structure
  setup: (body: {
    totalFloors: number;
    roomsPerFloor: number;
    bedsPerRoom: number;
  }) =>
    apiRequest(pgScoped("/super-admin/setup-rooms"), {
      method: "POST",
      body,
    }),

  listRooms: () => apiRequest<unknown[]>(pgScoped("/rooms")),

  listBeds: () => apiRequest<unknown[]>(pgScoped("/beds")),

  availableBeds: () => apiRequest<unknown[]>(pgScoped("/beds/available")),

  createFloor: (body: {
    floorNo: number;
    roomsPerFloor: number;
    bedsPerRoom: number;
  }) =>
    apiRequest(pgScoped("/super-admin/floors/create"), {
      method: "POST",
      body,
    }),

  createRoom: (body: {
    floorNo: number;
    roomNo: string | number;
    bedsPerRoom: number;
  }) =>
    apiRequest(pgScoped("/super-admin/rooms/create"), {
      method: "POST",
      body,
    }),

  createBed: (body: {
    roomId: number;
    bedNo: number;
    bedCode: string;
  }) =>
    apiRequest(pgScoped("/super-admin/beds/create"), {
      method: "POST",
      body,
    }),

  // Students
  listStudents: () => apiRequest<unknown[]>(pgScoped("/students")),

  createStudent: (body: Record<string, unknown>) =>
    apiRequest(pgScoped("/students"), {
      method: "POST",
      body,
    }),

  updateStudent: (id: number | string, body: Record<string, unknown>) =>
    apiRequest(pgScoped(`/students/${id}`), {
      method: "PATCH",
      body,
    }),

  deleteStudent: (id: number | string) =>
    apiRequest(pgScoped(`/students/${id}`), {
      method: "DELETE",
    }),

  downloadAllStudents: () =>
    apiDownload(pgScoped("/students/download/all"), "all-students.csv"),

  downloadUnpaidStudents: () =>
    apiDownload(pgScoped("/students/download/unpaid"), "unpaid-students.csv"),

  // Monthly status
  listMonthly: () => apiRequest<unknown[]>(pgScoped("/monthly-status")),

  monthlyForStudent: (studentId: number | string) =>
    apiRequest<unknown[] | unknown>(
      pgScoped(`/monthly-status/student/${studentId}`),
    ),

  toggleStudentPayment: (studentId: number | string) =>
    apiRequest(pgScoped(`/students/${studentId}/payment`), {
      method: "PATCH",
    }),

  markPaid: (studentId: number | string) =>
    apiRequest(pgScoped(`/students/${studentId}/mark-paid`), {
      method: "PATCH",
    }),

  updateDueAmount: (studentId: number | string, amount: number) =>
    apiRequest(pgScoped(`/students/${studentId}/due-amount`), {
      method: "PATCH",
      body: { amount },
    }),

  // Workers
  listWorkers: () => apiRequest<unknown[]>(pgScoped("/workers")),

  createWorker: (body: Record<string, unknown>) =>
    apiRequest(pgScoped("/workers"), {
      method: "POST",
      body,
    }),

  updateWorker: (id: number | string, body: Record<string, unknown>) =>
    apiRequest(pgScoped(`/workers/${id}`), {
      method: "PATCH",
      body,
    }),

  deleteWorker: (id: number | string) =>
    apiRequest(pgScoped(`/workers/${id}`), {
      method: "DELETE",
    }),

  // Food menu
  listMenu: () => apiRequest<unknown[]>(pgScoped("/menu")),

  createMenu: (body: Record<string, unknown>) =>
    apiRequest(pgScoped("/menu"), {
      method: "POST",
      body,
    }),

  updateMenu: (id: number | string, body: Record<string, unknown>) =>
    apiRequest(pgScoped(`/menu/${id}`), {
      method: "PATCH",
      body,
    }),

  deleteMenu: (id: number | string) =>
    apiRequest(pgScoped(`/menu/${id}`), {
      method: "DELETE",
    }),
};
