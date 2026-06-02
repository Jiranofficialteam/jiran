import { supabase } from "@/integrations/supabase/client";

const authBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1`;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type DirectAuthResult = {
  access_token?: string;
  refresh_token?: string;
  user?: unknown;
  session?: {
    access_token?: string;
    refresh_token?: string;
  };
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
};

export const isAuthFetchError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || "");
  return /failed to fetch|networkerror|load failed|fetch/i.test(message);
};

const authPost = <T,>(path: string, body: Record<string, unknown>) =>
  new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${authBaseUrl}${path}`, true);
    xhr.timeout = 20000;
    xhr.setRequestHeader("apikey", publishableKey);
    xhr.setRequestHeader("authorization", `Bearer ${publishableKey}`);
    xhr.setRequestHeader("content-type", "application/json;charset=UTF-8");
    xhr.setRequestHeader("x-client-info", "jiran-auth-xhr-fallback");

    xhr.onload = () => {
      let payload: DirectAuthResult | null = null;
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        payload = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as T);
        return;
      }

      const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || "লগইন/সাইনআপ সম্পন্ন করা যায়নি";
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("সার্ভারের সাথে সংযোগ করা যাচ্ছে না। Published app-এ চেষ্টা করুন।"));
    xhr.ontimeout = () => reject(new Error("সংযোগের সময় শেষ হয়েছে। আবার চেষ্টা করুন।"));
    xhr.send(JSON.stringify(body));
  });

const applyDirectSession = async (result: DirectAuthResult) => {
  const accessToken = result.session?.access_token || result.access_token;
  const refreshToken = result.session?.refresh_token || result.refresh_token;

  if (!accessToken || !refreshToken) return null;

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return error;
};

export const signInWithXHRFallback = async (email: string, password: string) => {
  const result = await authPost<DirectAuthResult>("/token?grant_type=password", {
    email,
    password,
    gotrue_meta_security: {},
  });

  return applyDirectSession(result);
};

export const signUpWithXHRFallback = async (
  email: string,
  password: string,
  metadata: Record<string, unknown>,
) => {
  const redirectTo = encodeURIComponent(window.location.origin);
  const result = await authPost<DirectAuthResult>(`/signup?redirect_to=${redirectTo}`, {
    email,
    password,
    data: metadata,
    gotrue_meta_security: {},
  });

  return applyDirectSession(result);
};