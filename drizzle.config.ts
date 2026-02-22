import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: [
    './src/schema/consultation.ts',
    './src/schema/consultation-medication.ts',
    './src/schema/consultation-service.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  verbose: true,
  strict: true,
});
