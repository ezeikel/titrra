import 'server-only';

// Fire a request at the Titrra content worker (Hetzner box, port 3070). The
// body carries only job params — never API keys. Auth is a shared bearer
// (WORKER_SECRET) that must match the worker's value.
export async function postToWorker(
  path: string,
  body: unknown = {},
): Promise<Response> {
  const workerUrl = process.env.WORKER_URL?.replace(/\/+$/, '');
  const workerSecret = process.env.WORKER_SECRET;
  if (!workerUrl) throw new Error('WORKER_URL not set');
  return fetch(`${workerUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(workerSecret ? { Authorization: `Bearer ${workerSecret}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
    // 10s ack budget; the worker runs the generation asynchronously.
    signal: AbortSignal.timeout(10_000),
  });
}
