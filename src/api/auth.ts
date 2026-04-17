import request, { type common_reponse_t } from "@/utils/request";

export type auth_response_t = {
  expired: string;
  token: string;
  user: string;
};

export async function authAPI() {
  const res =
    await request.post<common_reponse_t<auth_response_t>>("/user/auth");

  return res.data;
}
