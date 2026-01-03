/**
 * Shared utility for dynamically determining the API URL.
 * This allows the frontend to work when accessed via localhost, IP address, or DNS name.
 */

/**
 * Get API base URL dynamically based on current hostname.
 * When accessed via IP or DNS name, API calls go to the same host on port 3000.
 */
export function getApiBaseUrl(): string {
  // During SSR or if window is not available, use the env variable or default
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  }

  // Get the current hostname from the browser
  const { hostname, protocol } = window.location;

  // If we're on localhost or 127.0.0.1, use the env variable or default
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  }

  // For any other hostname (IP address or DNS name), use the same host with backend port
  return `${protocol}//${hostname}:3000/api/v1`;
}

/**
 * Get WebSocket URL dynamically based on current hostname.
 */
export function getWsBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
  }

  const { hostname, protocol } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  return `${protocol}//${hostname}:3000`;
}
