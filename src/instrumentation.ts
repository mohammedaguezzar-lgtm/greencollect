export async function register() {
  if (process.env.NODE_ENV === 'production') {
    const { validateProductionEnv } = await import('@/lib/env');
    validateProductionEnv();
  }
}
