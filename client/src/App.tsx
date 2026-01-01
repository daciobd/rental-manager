import { useState } from "react";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  FileText,
  DollarSign,
  Calculator,
  ClipboardList,
  Home,
  LogOut,
} from "lucide-react";

import Dashboard from "@/pages/dashboard";
import Properties from "@/pages/properties";
import Contracts from "@/pages/contracts";
import Payments from "@/pages/payments";
import Taxes from "@/pages/taxes";
import Reports from "@/pages/reports";
import AuthPage from "@/pages/auth";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "imoveis", label: "Imóveis", icon: Building2 },
  { id: "contratos", label: "Contratos", icon: FileText },
  { id: "recebimentos", label: "Recebimentos", icon: DollarSign },
  { id: "impostos", label: "Impostos", icon: Calculator },
  { id: "relatorios", label: "Relatórios", icon: ClipboardList },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: user, isLoading: authLoading, refetch } = useQuery<{ id: string; username: string } | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0,
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Auth check failed");
      return res.json();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "imoveis":
        return <Properties />;
      case "contratos":
        return <Contracts />;
      case "recebimentos":
        return <Payments />;
      case "impostos":
        return <Taxes />;
      case "relatorios":
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onSuccess={() => refetch()} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-md">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold">Gestão de Aluguéis</h1>
                <p className="text-xs text-muted-foreground">
                  Olá, {user.username}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-16 z-40 w-full border-b bg-background">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex h-12 w-full justify-start gap-1 bg-transparent p-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                      data-testid={`tab-${tab.id}`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </Tabs>
        </div>
      </nav>

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      <footer className="border-t py-6 mt-auto">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            Sistema de Gestão de Aluguéis - Controle completo de recebimentos, recibos e impostos
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
