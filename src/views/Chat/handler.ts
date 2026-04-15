export type deepseek_chat_chunk_t = {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  system_fingerprint?: string;
  choices: choice_t[];
  usage?: usage_t;
};

export type choice_t = {
  index: number;
  delta: delta_t;
  logprobs: null | unknown;
  finish_reason: string | null;
};

export type delta_t = {
  content?: string;
};

export type usage_t = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: {
    cached_tokens: number;
  };
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
};
