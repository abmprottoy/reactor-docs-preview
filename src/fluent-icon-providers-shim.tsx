import type { PropsWithChildren } from "react";

type IconDirectionContextProviderProps = PropsWithChildren<{
  value?: "ltr" | "rtl";
}>;

export function IconDirectionContextProvider({ children }: IconDirectionContextProviderProps) {
  return children;
}
