import { getStoredAuth, refreshAuthToken } from "@/api/auth";
import {
  fetchEventSource,
  type EventSourceMessage,
} from "@microsoft/fetch-event-source";

const AUTH_RETRY_LIMIT = 1;

class AuthRetryError extends Error {
  constructor() {
    super("AUTH_RETRY");
  }
}

export type sse_event_t = {
  onmessage?: (e: EventSourceMessage) => void;
  onerror?: (e: any) => void;
  onclose?: () => void;
  onopen?: (r: Response) => Promise<void>;
};

export type sse_param_t = {
  url: string;
};

export class SSE {
  private cfg: sse_param_t;

  constructor(param: sse_param_t) {
    this.cfg = param;
  }

  public create(
    body: Record<string, any>,
    events: sse_event_t = {},
    headers: Record<string, any> = {},
  ) {
    const ctrl = new AbortController();
    let url = this.cfg.url + "?";

    url = url.slice(0, url.length - 1);

    const postHeaders = Object.assign({}, headers);
    const auth = getStoredAuth();
    if (auth?.token) {
      postHeaders.Authorization = `Bearer ${auth.token}`;
    }

    let authRetryCount = 0;

    fetchEventSource(url, {
      method: "POST",
      headers: postHeaders,
      body: JSON.stringify(body),
      onmessage: events.onmessage,
      onerror: (err) => {
        if (err instanceof AuthRetryError) {
          return 0;
        }

        return events.onerror?.(err);
      },
      onclose: events.onclose,
      onopen: async (r) => {
        if (r.status === 401) {
          if (authRetryCount >= AUTH_RETRY_LIMIT) {
            throw new Error("SSE auth retry limit reached");
          }

          authRetryCount += 1;
          const nextAuth = await refreshAuthToken();
          if (!nextAuth?.token) {
            throw new Error("SSE auth refresh failed");
          }

          postHeaders.Authorization = `Bearer ${nextAuth.token}`;
          throw new AuthRetryError();
        }

        return events.onopen?.(r);
      },
      signal: ctrl.signal,
    });

    return ctrl.abort;
  }
}
