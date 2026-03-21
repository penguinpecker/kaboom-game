"use client";
import { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { somniaTestnet } from "@/lib/chain";

const PRIVY_APP_ID = "cmmzi6sr1002y0ci4dmt2w88n";

const wagmiConfig = createConfig({
  chains: [somniaTestnet],
  transports: {
    [somniaTestnet.id]: http("https://dream-rpc.somnia.network", {
      timeout: 10_000,
    }),
  },
  // Disable auto-discovery of injected wallets (EIP-6963).
  // Coinbase Smart Wallet SDK gets auto-loaded otherwise and fails on chain 50312,
  // corrupting wagmi connector state and breaking writeContract().
  // Privy's embedded wallet connector is injected separately by WagmiProvider — unaffected.
  multiInjectedProviderDiscovery: false,
  // NOTE: pollingInterval removed from here intentionally.
  // Setting it globally throttles Privy's internal connector sync.
  // Fast polling (300ms) is set per-call in waitForTransactionReceipt instead.
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#60a5fa",
          walletList: ["metamask", "detected_ethereum_wallets"],
        },
        defaultChain: somniaTestnet,
        supportedChains: [somniaTestnet],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
          showWalletUIs: false,
        },
        loginMethods: ["google", "email", "wallet"],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
