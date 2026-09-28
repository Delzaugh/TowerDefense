/** A failed JavaScript import needs a page reload because module failures are cached. */
export async function withDeadline<T>(pending: Promise<T>, timeoutMs = 20_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('The screen took too long to download. Please reload.')), timeoutMs);
  });
  try { return await Promise.race([pending, deadline]); }
  finally { clearTimeout(timer); }
}
