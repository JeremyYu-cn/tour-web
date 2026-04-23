import axios from "axios";
import {
  getLocalstorage,
  removeLocalstorage,
  setLocalstorage,
} from "@/localStorage";
import type { common_reponse_t } from "@/types/request";

export type auth_response_t = {
  expired: string;
  token: string;
  user: string;
};

const authRequest = axios.create({
  baseURL: "http://localhost:6780/api/v1",
});

let refreshAuthPromise: Promise<auth_response_t | null> | null = null;

export function getStoredAuth() {
  return getLocalstorage<auth_response_t>("token");
}

export async function loginAPI() {
  const res = await authRequest.post<common_reponse_t<auth_response_t>>(
    "/user/login",
    {
      user: "admin",
      pass: "admin",
    },
  );

  return res.data;
}

export async function refreshAuthToken() {
  if (refreshAuthPromise) {
    return refreshAuthPromise;
  }

  refreshAuthPromise = (async () => {
    const res = await loginAPI();

    if (!res.ok) {
      removeLocalstorage("token");
      return null;
    }

    setLocalstorage("token", res.data);
    return res.data;
  })().finally(() => {
    refreshAuthPromise = null;
  });

  return refreshAuthPromise;
}
