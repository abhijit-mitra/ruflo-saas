import { loadSecrets } from './config/secrets';

async function main() {
  // Load secrets before importing app (which initializes Prisma/config)
  await loadSecrets();

  const app = (await import('./app')).default;
  const PORT = parseInt(process.env.PORT || '4000', 10);

  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

main().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
