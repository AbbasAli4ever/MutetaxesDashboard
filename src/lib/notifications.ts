import { API_BASE_URL, authFetch } from "@/lib/auth";

export interface NotificationUser {
  id: number;
  name: string;
  email: string;
}

export interface NotificationItem {
  id: number;
  actorId: number;
  acteeId: number;
  message: string;
  projectName: string;
  isRead: boolean;
  createdAt: string;
  actor?: NotificationUser | null;
  actee?: NotificationUser | null;
}

export type NotificationStreamPayload =
  | NotificationItem[]
  | NotificationItem
  | { warning: string };

function extractErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const body = data as { message?: string; error?: string | { message?: string } };
  if (typeof body.error === "string" && body.error.trim()) return body.error;
  if (typeof body.message === "string" && body.message.trim()) return body.message;
  if (body.error && typeof body.error === "object" && typeof body.error.message === "string") {
    return body.error.message;
  }
  return fallback;
}

export async function markNotificationRead(notificationId: number): Promise<NotificationItem> {
  const response = await authFetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, `Failed to mark notification as read (${response.status})`));
  }

  const body = data as { notification?: NotificationItem };
  if (!body.notification) {
    throw new Error("Invalid response from notification read endpoint");
  }
  return body.notification;
}

function parseSseEventData(rawEvent: string): string | null {
  const lines = rawEvent.split(/\r?\n/);
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line.startsWith("data:")) continue;
    dataLines.push(line.slice(5).trimStart());
  }

  if (!dataLines.length) return null;
  return dataLines.join("\n");
}

export async function openNotificationStream(args: {
  accessToken: string;
  signal?: AbortSignal;
  onOpen?: () => void;
  onPayload: (payload: NotificationStreamPayload) => void;
}): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/stream`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      Accept: "text/event-stream",
    },
    signal: args.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to open notification stream (${response.status})`);
  }

  args.onOpen?.();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      const jsonPayload = parseSseEventData(rawEvent);
      if (!jsonPayload) continue;

      try {
        args.onPayload(JSON.parse(jsonPayload) as NotificationStreamPayload);
      } catch {
        // Ignore malformed events to keep stream alive.
      }
    }
  }
}
