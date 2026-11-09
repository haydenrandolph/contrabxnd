// Browser push providers only: Google FCM, Mozilla Autopush (regional hosts),
// and Apple Web Push. Do not allow arbitrary HTTPS hosts or broad cloud domains.
export function validPushEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 4096) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash &&
      (url.hostname === 'fcm.googleapis.com' || url.hostname === 'updates.push.services.mozilla.com' ||
        url.hostname.endsWith('.push.services.mozilla.com') || url.hostname === 'web.push.apple.com');
  } catch {
    return false;
  }
}

export function validPushKeys(p256dh: unknown, auth: unknown): boolean {
  return typeof p256dh === 'string' && /^[A-Za-z0-9_-]{1,256}={0,2}$/.test(p256dh) &&
    typeof auth === 'string' && /^[A-Za-z0-9_-]{1,128}={0,2}$/.test(auth);
}
