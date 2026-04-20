export type common_reponse_t<T = any> = {
  ok: boolean;
  code: number;
  msg: string;
  data: T;
};
