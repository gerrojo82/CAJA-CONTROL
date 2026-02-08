import { supabase, hasSupabase } from "./supabase";

export const storage = {
  async get(key) {
    if (hasSupabase) {
      try {
        const { data, error } = await supabase
          .from("app_state")
          .select("value")
          .eq("key", key)
          .maybeSingle();
        if (!error && data?.value != null) {
          return { value: data.value };
        }
      } catch {}
    }
    try {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch {
      return null;
    }
  },
  async set(key, value) {
    if (hasSupabase) {
      try {
        const { error } = await supabase
          .from("app_state")
          .upsert({ key, value, updated_at: new Date().toISOString() });
        if (!error) {
          try { localStorage.setItem(key, value); } catch {}
          return;
        }
      } catch {}
    }
    try { localStorage.setItem(key, value); } catch {}
  },
};
