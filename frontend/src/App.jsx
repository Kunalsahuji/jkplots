import { BrowserRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import AppRoutes from "./router/AppRoutes";
import Preloader from "./components/site/Preloader";
import { useAuth } from "./context/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const { isLoading } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <Preloader isLoading={isLoading} />
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
