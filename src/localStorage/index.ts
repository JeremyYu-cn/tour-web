type localstrorage_key_t = "token";

export function getLocalstorage<T = any>(key: localstrorage_key_t): T | null {
  let res = localStorage.getItem(key);
  try {
    if (res != null) {
      res = JSON.parse(res);
    }
  } catch {}
  return res as T;
}

export function setLocalstorage(key: localstrorage_key_t, value: string) {
  localStorage.setItem(key, value);
  return true;
}
