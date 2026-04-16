export type sse_param_t = {
  url: string;
};

export class SSE {
  private cfg: sse_param_t;
  private ev: EventSource | null;

  constructor(param: sse_param_t) {
    this.cfg = param;
    this.ev = null;
  }

  public create(query: Record<string, any>): EventSource {
    let url = this.cfg.url + "?";

    for (let [key, value] of Object.entries(query)) {
      url += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
    }

    url = url.slice(0, url.length - 1);

    this.ev = new EventSource(url);
    return this.ev;
  }
}
