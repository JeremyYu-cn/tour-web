import { marked } from "marked";
import dompurify from "dompurify";

function wrapTables(html: string) {
  if (typeof document === "undefined") {
    return html;
  }

  const container = document.createElement("div");
  container.innerHTML = html;

  container.querySelectorAll("table").forEach((table) => {
    const wrapper = document.createElement("div");
    wrapper.className = "markdown-table-wrap";
    table.classList.add("markdown-table");

    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });

  return container.innerHTML;
}

export async function renderMarkdown(content: string) {
  const html = await marked(content);
  const sanitizedHtml = dompurify.sanitize(html);
  return wrapTables(sanitizedHtml);
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
