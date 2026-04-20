import { marked } from "marked";
import dompurify from "dompurify";

export async function renderMarkdown(content: string) {
  const html = await marked(content);
  return dompurify.sanitize(html);
}

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
      cb(await renderMarkdown(cache));
      renderTimer = null;
    }, interval);
  };
}
