"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TripChromeState = {
  title: string;
  subtitle: string;
  /** Trip detail header: menu, camera (Photos), or invite (Members). */
  headerRight?: "menu" | "camera" | "invitePeople";
  /** Join link for this trip (`/join/{token}`); used by Share invite in the menu. */
  inviteUrl?: string;
  onCamera?: () => void;
  /** Copy invite link / focus invite (Members tab). */
  onInvitePeople?: () => void;
} | null;

type TripChromeContextValue = {
  chrome: TripChromeState;
  setChrome: (next: TripChromeState) => void;
};

const noop = () => {};

const TripChromeContext = createContext<TripChromeContextValue>({
  chrome: null,
  setChrome: noop,
});

export function TripChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChromeState] = useState<TripChromeState>(null);
  const setChrome = useCallback((next: TripChromeState) => {
    setChromeState(next);
  }, []);
  const value = useMemo(
    () => ({ chrome, setChrome }),
    [chrome, setChrome],
  );
  return (
    <TripChromeContext.Provider value={value}>
      {children}
    </TripChromeContext.Provider>
  );
}

/** Safe on any page; setChrome is no-op outside TripChromeProvider if not wrapped. */
export function useTripChrome() {
  return useContext(TripChromeContext);
}
