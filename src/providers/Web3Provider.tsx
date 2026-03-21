"use client";
import { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
// CRITICAL: Import WagmiProvider and createConfig from @privy-io/wagmi, NOT from wagmi
// This bridges Privy embedded wallets into wagmi hooks (useAccount, useBalance, etc.)
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { somniaTestnet } from "@/lib/chain";

const PRIVY_APP_ID = "cmmzi6sr1002y0ci4dmt2w88n";

// Use @privy-io/wagmi's createConfig — this injects Privy wallets as wagmi connectors
const wagmiConfig = createConfig({
  chains: [somniaTestnet],
  transports: {
    [somniaTestnet.id]: http("https://dream-rpc.somnia.network"),
  },
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
        },
        defaultChain: somniaTestnet,
        supportedChains: [somniaTestnet],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        loginMethods: ["google", "email", "wallet"],
      }}
    >
      <QueryClientProvider client={queryClient}>
        {/* MUST be inside PrivyProvider — bridges Privy wallets into wagmi */}
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
