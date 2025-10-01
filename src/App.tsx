import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
} from "@txnlab/use-wallet-react";

const queryClient = new QueryClient();

const App = () => {
  let walletConnectProjectId: string | null;
  if (!walletConnectProjectId) {
    walletConnectProjectId = "e7b04c22de006e0fc7cef5a00cb7fac9";
  }

  const walletManager = new WalletManager({
    wallets: [
      //WalletId.PERA,
      //WalletId.DEFLY,
      WalletId.KIBISIS,
      {
        id: WalletId.LUTE,
        options: { siteName: "VOI Vote Viz" },
      },
      {
        id: WalletId.BIATEC,
        options: {
          projectId: walletConnectProjectId,
          metadata: {
            name: "VOI Vote Viz",
            url: "https://voi-vote-viz.vercel.app",
            description: "VOI Vote Visualization App",
            icons: ["https://voi-vote-viz.vercel.app/favicon.ico"],
          },
          themeMode: "light",
          enableExplorer: true,
          explorerRecommendedWalletIds: [],
          privacyPolicyUrl: "https://voi-vote-viz.vercel.app/privacy",
          termsOfServiceUrl: "https://voi-vote-viz.vercel.app/terms",
          themeVariables: {},
        },
      },
      {
        id: WalletId.WALLETCONNECT,
        options: {
          projectId: walletConnectProjectId,
          metadata: {
            name: "VOI Vote Viz",
            url: "https://voi-vote-viz.vercel.app",
            description: "VOI Vote Visualization App",
            icons: ["https://voi-vote-viz.vercel.app/favicon.ico"],
          },
          themeMode: "light",
          enableExplorer: true,
          explorerRecommendedWalletIds: [],
          privacyPolicyUrl: "https://voi-vote-viz.vercel.app/privacy",
          termsOfServiceUrl: "https://voi-vote-viz.vercel.app/terms",
          themeVariables: {},
        },
      },
      {
        id: WalletId.MNEMONIC,
        options: {
          persistToStorage: true,
        },
      },
    ],
    network: NetworkId.VOIMAIN,
  });

  return (
    <WalletProvider manager={walletManager}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </WalletProvider>
  );
};

export default App;
