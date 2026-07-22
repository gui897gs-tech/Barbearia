import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./server/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(
      JSON.stringify({
        event: "request_middleware_failed",
        errorType: error instanceof Error ? error.name : "UnknownError",
        at: new Date().toISOString(),
      }),
    );
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
