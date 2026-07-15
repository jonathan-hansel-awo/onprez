import * as Sentry from "@sentry/nextjs";

import { scrubSentryEvent } from "@/lib/monitoring/sentry-scrubber";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: process.env.NODE_ENV === "production" && Boolean(dsn),
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  sendDefaultPii: false,
  tracesSampleRate: 0.05,
  attachStacktrace: true,
  beforeSend: (event) => scrubSentryEvent(event),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
