import { createContext, useContext, useState } from "react";

const HomeSheetContext = createContext();

export const HomeSheetProvider = ({ children }) => {
  const [isHomeSheetOpen, setIsHomeSheetOpen] = useState(false);

  const openHomeSheet = () => setIsHomeSheetOpen(true);
  const closeHomeSheet = () => setIsHomeSheetOpen(false);

  return (
    <HomeSheetContext.Provider
      value={{
        isHomeSheetOpen,
        openHomeSheet,
        closeHomeSheet,
      }}
    >
      {children}
    </HomeSheetContext.Provider>
  );
};

export const useHomeSheet = () => {
  const context = useContext(HomeSheetContext);
  if (!context) {
    throw new Error("useHomeSheet must be used within a HomeSheetProvider");
  }
  return context;
};
