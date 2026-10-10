/**
 * Robust API Client with:
 * 1. 120-second timeout configuration to prevent premature timeouts during AI generation or Render cold starts.
 * 2. Exponential backoff retry mechanism for transient errors (500, 502, 503, 504, 429, cold starts).
 * 3. Background keep-alive ping loop for Render free instance hibernation prevention.
 */

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_TIMEOUT_MS = 120000; // 120 seconds
const DEFAULT_RETRIES = 2; // Up to 2 retries (3 total attempts)
const DEFAULT_RETRY_DELAY_MS = 2000; // 2 seconds initial backoff

export async function apiRequest<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    onRetry,
    headers = {},
    ...restOptions
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Read response
      let data: any = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      // Check if retryable server error (502/503/504 cold starts, or 429 rate limit)
      if (!response.ok && [429, 502, 503, 504].includes(response.status) && attempt < retries) {
        lastError = new Error(data.error || `Server status ${response.status}`);
        if (onRetry) onRetry(attempt + 1, lastError);
        const delay = retryDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      // Handle abort / timeout
      if (err.name === 'AbortError') {
        lastError = new Error(
          'استغرق الطلب وقتاً أطول من المعتاد (أكثر من دقيقتين). قد يكون السيرفر في وضع الاستيقاظ (Cold Start) أو أن حجم العملية كبير. يرجى إعادة المحاولة.'
        );
      }

      // If we still have retries, wait and retry
      if (attempt < retries) {
        if (onRetry) onRetry(attempt + 1, lastError);
        const delay = retryDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }

  throw lastError || new Error('تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.');
}

/**
 * Initiates an automatic Keep-Alive ping loop to ping `/api/health`
 * every 10 minutes to keep the Render free backend awake.
 */
export function startKeepAlivePing(intervalMinutes: number = 10) {
  const intervalMs = intervalMinutes * 60 * 1000;

  const ping = async () => {
    try {
      await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(10000), // 10s timeout
      });
    } catch {
      // Ignore background ping errors
    }
  };

  // Initial ping on load
  ping();

  // Periodic interval
  const timer = setInterval(ping, intervalMs);
  return () => clearInterval(timer);
}
