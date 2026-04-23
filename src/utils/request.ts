import { getStoredAuth, refreshAuthToken } from "@/api/auth";
import type { common_reponse_t } from "@/types/request";
import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

type retryable_request_t = InternalAxiosRequestConfig & {
  _authRetryCount?: number;
};

const AUTH_RETRY_LIMIT = 1;
const BASE_URL = "http://localhost:6780/api/v1";

const request = axios.create({
  baseURL: BASE_URL,
});

request.interceptors.request.use((req: retryable_request_t) => {
  req._authRetryCount ??= 0;
  req.headers = AxiosHeaders.from(req.headers);

  const auth = getStoredAuth();
  if (auth?.token) {
    req.headers.set("Authorization", `Bearer ${auth.token}`);
  }
  return req;
});

request.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<common_reponse_t>) => {
    const req = error.config as retryable_request_t | undefined;

    if (
      !req ||
      error.response?.status !== 401 ||
      (req._authRetryCount ?? 0) >= AUTH_RETRY_LIMIT
    ) {
      return Promise.reject(error);
    }

    req._authRetryCount = (req._authRetryCount ?? 0) + 1;

    try {
      const auth = await refreshAuthToken();
      if (!auth?.token) {
        return Promise.reject(error);
      }

      req.headers = AxiosHeaders.from(req.headers);
      req.headers.set("Authorization", `Bearer ${auth.token}`);
      return request(req);
    } catch {
      return Promise.reject(error);
    }
  },
);

export default request;
