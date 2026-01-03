export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSiriFetcher } = await import("@/lib/cron");
    startSiriFetcher();
  }
}
