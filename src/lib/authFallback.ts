const authBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1`;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const projectRef = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split(".")[0];
const authStorageKey = `sb-${projectRef}-auth-token`;

type DirectAuthResult = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user?: unknown;
  session?: {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
    user?: unknown;
  };
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
};

export const isAuthFetchError = (error: unknown) => {
  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message || "")
      : String(error || "");

  return /failed to fetch|networkerror|load failed|fetch/i.test(message);
};

const authFunctionPost = async (body: Record<string, unknown>) => {
  const response = await fetch("/functions/v1/jiran-auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
      authorization: `Bearer ${publishableKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null) as DirectAuthResult | null;

  if (data?.error) throw new Error(data.error);
  if (!response.ok) throw new Error(data?.message || "লগইন/সাইনআপ সম্পন্ন করা যায়নি");

  return data || {};
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

    xhr.onerror = () => reject(new Error("সার্ভারের সাথে সংযোগ করা যাচ্ছে না। আবার চেষ্টা করুন।"));
    xhr.ontimeout = () => reject(new Error("সংযোগের সময় শেষ হয়েছে। আবার চেষ্টা করুন।"));
    xhr.send(JSON.stringify(body));
  });

const applyDirectSession = (result: DirectAuthResult) => {
  const accessToken = result.session?.access_token || result.access_token;
  const refreshToken = result.session?.refresh_token || result.refresh_token;
  const user = result.session?.user || result.user;

  if (!accessToken || !refreshToken || !user) return false;

  const expiresIn = result.session?.expires_in || result.expires_in || 3600;
  const expiresAt = result.session?.expires_at || result.expires_at || Math.floor(Date.now() / 1000) + expiresIn;

  localStorage.setItem(authStorageKey, JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    expires_in: expiresIn,
    token_type: result.session?.token_type || result.token_type || "bearer",
    user,
  }));

  return true;
};

export const signInWithXHRFallback = async (email: string, password: string) => {
  try {
    const result = await authFunctionPost({ mode: "signin", email, password });
    if (applyDirectSession(result)) return true;
  } catch (functionError) {
    if (!isAuthFetchError(functionError)) throw functionError;
  }

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
  try {
    const result = await authFunctionPost({ mode: "signup", email, password, metadata });
    if (applyDirectSession(result)) return true;
  } catch (functionError) {
    if (!isAuthFetchError(functionError)) throw functionError;
  }

  const redirectTo = encodeURIComponent(window.location.origin);
  const result = await authPost<DirectAuthResult>(`/signup?redirect_to=${redirectTo}`, {
    email,
    password,
    data: metadata,
    gotrue_meta_security: {},
  });

  return applyDirectSession(result);
};