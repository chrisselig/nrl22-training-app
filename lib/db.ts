import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

function getDatabaseUrl(): string {
  // Vercel's Postgres/Neon integration names its vars with a
  // store-specific prefix (e.g. `nrl_training_DATABASE_URL`) rather than
  // the plain `DATABASE_URL` this app's code and migrate script expect.
  const url = process.env.DATABASE_URL ?? process.env.nrl_training_DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

let client: NeonQueryFunction<false, false> | undefined;

function getClient(): NeonQueryFunction<false, false> {
  client ??= neon(getDatabaseUrl());
  return client;
}

// Lazy: constructed on first use, not at module load. Next.js imports route
// modules during the build's page-data-collection step, which must not
// require a live DATABASE_URL just to discover the route exists. The Proxy
// defers construction until the tagged-template call or a method like
// `.transaction()` actually happens.
export const sql: NeonQueryFunction<false, false> = new Proxy(
  (() => {}) as unknown as NeonQueryFunction<false, false>,
  {
    apply(_target, _thisArg, args) {
      return Reflect.apply(
        getClient() as unknown as (...a: unknown[]) => unknown,
        undefined,
        args,
      );
    },
    get(_target, prop) {
      return Reflect.get(getClient(), prop);
    },
  },
);
