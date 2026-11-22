/**
 * Runs once when the server starts. The Node-only work lives in its own file and is imported only
 * under the Node runtime, so it is never bundled for the edge runtime (which has no `net`/`tls`).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { warmDatabase } = await import('./instrumentation-node');
    await warmDatabase();
  }
}
