import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const PublishSelectionContext = createContext(null);

export function PublishSelectionProvider({ children }) {
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState([]);

  const clearPublishSelections = () => {
    setSelectedCollaborators([]);
    setSelectedSponsor([]);
  };

  const value = useMemo(
    () => ({
      selectedSponsor,
      selectedCollaborators,
      setSelectedSponsor,
      setSelectedCollaborators,
      clearPublishSelections,
    }),
    [selectedSponsor, selectedCollaborators],
  );

  return (
    <PublishSelectionContext.Provider value={value}>
      {children}
    </PublishSelectionContext.Provider>
  );
}

export function usePublishSelections() {
  const ctx = useContext(PublishSelectionContext);
  if (!ctx) {
    throw new Error(
      "usePublishSelections must be used within PublishSelectionProvider",
    );
  }
  return ctx;
}
