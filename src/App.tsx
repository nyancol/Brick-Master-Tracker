import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { useCurrentUser } from "@/api";
import Home from "@/pages/home";
import Login from "@/pages/login";
import { Loader2 } from "lucide-react";
import { t } from "@/hooks/use-translation";

export default function App() {
  const { data, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.user) {
    return (
      <ThemeProvider>
        <Login />
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Home user={data.user} users={data.users} />
      <Toaster />
    </ThemeProvider>
  );
}