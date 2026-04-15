type msg_listener_func_t<T = any> = (e: MessageEvent<T>) => void;
type err_listener_func_t = (e: Event) => void;

export type sse_param_t = {
  url: string;
};

export type sse_instance_t = {
  pushMessageListener: <T = any>(task: msg_listener_func_t<T>) => void;
  pushErrorListtener: (task: err_listener_func_t) => void;
  handleOpenEvent: (func: (ev: Event) => void) => void;
  run: (query: Record<string, any>) => void;
  close: () => void;
};

export class SSE {
  private cfg: sse_param_t;
  private msgListeners: msg_listener_func_t[];
  private errListeners: err_listener_func_t[];
  private onOpen: ((ev: Event) => void) | null;
  private ev: EventSource | null;

  constructor(param: sse_param_t) {
    this.cfg = param;
    this.msgListeners = [];
    this.errListeners = [];
    this.onOpen = null;
    this.ev = null;
  }

  private pushMessageListener(task: msg_listener_func_t) {
    this.msgListeners.push(task);
  }

  private pushErrorListtener(task: err_listener_func_t) {
    this.errListeners.push(task);
  }

  private handleOpenEvent(func: (e: Event) => void) {
    this.onOpen = func;
  }

  public create(): sse_instance_t {
    return {
      pushMessageListener: this.pushMessageListener.bind(this),
      pushErrorListtener: this.pushErrorListtener.bind(this),
      handleOpenEvent: this.handleOpenEvent.bind(this),
      run: (query: Record<string, any>) => {
        let url = this.cfg.url + "?";

        for (let [key, value] of Object.entries(query)) {
          url += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
        }

        url = url.slice(0, url.length - 1);

        this.ev = new EventSource(url);
        this.ev.onmessage = async (ev) => {
          for (let task of this.msgListeners) {
            await task(ev);
          }
        };

        this.ev.onerror = async (ev) => {
          for (let task of this.errListeners) {
            await task(ev);
          }
        };

        this.ev.onopen = this.onOpen;
      },
      close: () => {
        this.ev?.close();
      },
    };
  }
}
