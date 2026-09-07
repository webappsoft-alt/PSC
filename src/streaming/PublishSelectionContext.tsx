import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { SelectedUser } from "@/types";

type PublishSelectionState = {
  selectedSponsor: SelectedUser[];
  selectedCollaborators: SelectedUser[];
  setSelectedSponsor: (users: SelectedUser[]) => void;
  setSelectedCollaborators: (users: SelectedUser[]) => void;
  clearPublishSelections: () => void;
};

const PublishSelectionContext = createContext<PublishSelectionState | null>(null);

export function PublishSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedCollaborators, setSelectedCollaborators] = useState<
    SelectedUser[]
  >([]);
  const [selectedSponsor, setSelectedSponsor] = useState<SelectedUser[]>([]);

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

export function usePublishSelections(): PublishSelectionState {
  const ctx = useContext(PublishSelectionContext);
  if (!ctx) {
    throw new Error(
      "usePublishSelections must be used within PublishSelectionProvider",
    );
  }
  return ctx;
}
