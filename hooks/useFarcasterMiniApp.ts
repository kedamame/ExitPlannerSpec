"use client";

import { useEffect, useRef, useState } from "react";

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface FarcasterState {
  isInMiniApp: boolean;
  isLoading: boolean;
  user: FarcasterUser | null;
}

export function useFarcasterMiniApp(): FarcasterState {
  const [state, setState] = useState<FarcasterState>({
    isInMiniApp: false,
    isLoading: true,
    user: null,
  });
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    let cancelled = false;

    async function init() {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        const isMiniApp = await sdk.isInMiniApp();

        if (!isMiniApp) {
          if (!cancelled) {
            setState({ isInMiniApp: false, isLoading: false, user: null });
          }
          return;
        }

        try {
          await sdk.actions.ready();
        } catch {
          // Skip if the host does not require an explicit ready signal.
        }

        try {
          const ethereumProvider = await sdk.wallet.getEthereumProvider();
          if (ethereumProvider && typeof window !== "undefined") {
            (
              window as Window & { ethereum?: Awaited<typeof ethereumProvider> }
            ).ethereum = ethereumProvider;
          }
        } catch {
          // Some miniapp sessions may not expose a wallet provider.
        }

        let user: FarcasterUser | null = null;
        try {
          const context = await sdk.context;
          if (context?.user) {
            const { fid, username, displayName, pfpUrl } = context.user;
            user = { fid, username, displayName, pfpUrl };
          }
        } catch {
          // Context can be unavailable during local browser testing.
        }

        if (!cancelled) {
          setState({ isInMiniApp: true, isLoading: false, user });
        }
      } catch {
        if (!cancelled) {
          setState({ isInMiniApp: false, isLoading: false, user: null });
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
