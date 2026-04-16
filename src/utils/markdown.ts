import { marked } from "marked";
import dompurify from "dompurify";

/**
 *
 * @param interval ms
 * @returns
 */
export function secheduleRender(interval: number = 100) {
  let renderTimer: number | null = null;
  let cache: string = "";
  return function (content: string, cb: (res: string) => void) {
    cache = content;
    if (renderTimer != null) {
      return;
    }

    renderTimer = setTimeout(async () => {
      const html = await marked(cache);
      cb(dompurify.sanitize(html));
      renderTimer = null;
    }, interval);
  };
}
