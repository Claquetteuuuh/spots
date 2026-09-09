import React, { createContext, useContext } from "react";

type TabContextValue = {
  /** Switch to a tab by its index (0=Map, 1=Search, 2=Add, 3=Notifications, 4=Profile) */
  setTabIndex: (index: number) => void;
  activeIndex: number;
};

const TabContext = createContext<TabContextValue>({
  setTabIndex: () => {},
  activeIndex: 0,
});

export const TabProvider = TabContext.Provider;

export function useTabSwitch() {
  return useContext(TabContext);
}
