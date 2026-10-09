import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './db/connect.js';

async function main() {
  // Fail fast if DB is unreachable, but keep the error message secret-safe.
  await connectDB(env.MONGODB_URI);

  const app = createApp();
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] listening on :${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[backend] failed to start');
  if (err instanceof Error) console.error(err.message);
  process.exit(1);
});
