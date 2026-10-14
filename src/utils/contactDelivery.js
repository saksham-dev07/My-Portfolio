// Edge rate limits can return HTML instead of the function's JSON envelope.
export async function readContactResponse(response) {
  if (response.status === 429) {
    const retry = Number(response.headers.get("Retry-After"));
    return {
      limited: true,
      retrySeconds:
        Number.isFinite(retry) && retry > 0 ? Math.min(3600, retry) : 60,
    };
  }
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error("Delivery failed");
  return { limited: false };
}
