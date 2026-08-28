import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./pages/Dashboard";
import NetworkStatsBadge from "./components/NetworkStatsBadge";
import { RoleProvider } from "./context/RoleContext";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

/** Application root: one React Query cache and the always-visible session network indicator. */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        <Dashboard />
        <NetworkStatsBadge />
      </RoleProvider>
    </QueryClientProvider>
  );
}
