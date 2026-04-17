import { type auth_response_t } from "@/api/auth";
import { getLocalstorage } from "@/localStorage";
import axios from "axios";

export type common_reponse_t<T = any> = {
  ok: boolean;
  code: number;
  msg: string;
  data: T;
};

const request = axios.create({
  baseURL: "http://localhost:6780/api/v1",
});

request.interceptors.request.use((req) => {
  const auth = getLocalstorage<auth_response_t>("token");
  if (auth) {
    req.headers.set("Authorization", `Bearer ${auth.token}`);
  }
  return req;
});

export default request;
