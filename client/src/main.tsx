import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry up to 3 times for transient server errors (502/503 during restarts)
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false;
        // Retry on HTML responses (502/503 proxy errors during server restart)
        if (error instanceof TRPCClientError) {
          const isTransient =
            error.message.includes("<!doctype") ||
            error.message.includes("Unexpected token") ||
            error.message.includes("502") ||
            error.message.includes("503");
          return isTransient;
        }
        return false;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // For local auth, /login is an internal SPA route
  const loginUrl = getLoginUrl();
  if (loginUrl.startsWith("/")) {
    // Use history.pushState to avoid full reload inside SPA
    window.history.pushState({}, "", loginUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  } else {
    window.location.href = loginUrl;
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    // Suppress expected auth errors (user not logged in) from polluting the console
    const isAuthError = error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG;
    if (!isAuthError) console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    // Suppress expected auth errors from polluting the console
    const isAuthError = error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG;
    if (!isAuthError) console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
