import { type auth_response_t } from "@/api/auth";
import { getLocalstorage } from "@/localStorage";
import {
  fetchEventSource,
  type EventSourceMessage,
} from "@microsoft/fetch-event-source";

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
    const auth = getLocalstorage<auth_response_t>("token");
    if (auth) {
      postHeaders.Authorization = `Bearer ${auth.token}`;
    }

    fetchEventSource(url, {
      method: "POST",
      headers: postHeaders,
      body: JSON.stringify(body),
      onmessage: events.onmessage,
      onerror: events.onerror,
      onclose: events.onclose,
      onopen: events.onopen,
      signal: ctrl.signal,
    });

    return ctrl.abort;
  }
}
