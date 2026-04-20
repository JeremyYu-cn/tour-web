type localstrorage_key_t = "token" | "sessionTitleMap";

export function getLocalstorage<T = any>(key: localstrorage_key_t): T | null {
  let res = localStorage.getItem(key);
  try {
    if (res != null) {
      res = JSON.parse(res);
    }
  } catch {}
  return res as T;
}

export function setLocalstorage(key: localstrorage_key_t, value: unknown) {
  const normalizedValue =
    typeof value === "string" ? value : JSON.stringify(value);
  localStorage.setItem(key, normalizedValue);
  return true;
}

export function removeLocalstorage(key: localstrorage_key_t) {
  localStorage.removeItem(key);
}
