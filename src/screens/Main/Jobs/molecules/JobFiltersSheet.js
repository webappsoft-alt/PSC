import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import FloatingSheet from "../../../../components/FloatingSheet";
import { setJobFilters } from "../../../../store/reducer/MatchingSlice";
import {
  CONTRACT_TYPES,
  DEFAULT_JOB_FILTERS,
  WORK_ARRANGEMENTS,
  WORK_SCHEDULES,
  resolveJobFilters,
} from "../../../../utils/career";
import { OptionList, SheetFooter, SheetListRow } from "./JobOptionSheet";

const k = (n) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`);
// the picked option (filters are single choice)
const summary = (list = [], labelOf = (v) => v) => (list.length ? labelOf(list[0]) : "");

/**
 * Figma Matching/Jobs › "Filters-Job-Marketplace" (8265:4684): "Filters" /
 * "Find the perfect fit for you!", rows Employment Type · Work Arrangement ·
 * Work Schedule · Salary Range (chevrons), footer Clear All + Confirm.
 * A row swaps the same sheet to its option list (Figma "Contract-Type",
 * "Location-Based" sheets) — one Modal, so iOS never presents a sheet while
 * another is dismissing. Salary Range is its own screen (Figma
 * "Salary-Range").
 */
const STEPS = {
  types: { title: "Contract Types", subtitle: "Find all options below:", options: CONTRACT_TYPES },
  modes: { title: "Location-Based", subtitle: "Find all options below:", options: WORK_ARRANGEMENTS },
  schedules: { title: "Work Schedule", subtitle: "Find all options below:", options: WORK_SCHEDULES },
};

const JobFiltersSheet = ({ visible, onDismiss, initialStep = null }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const saved = useSelector((state) => state.matching?.jobFilters);
  const [draft, setDraft] = useState(() => resolveJobFilters(saved));
  const [step, setStep] = useState(null);
  // Salary Range opens its screen only once the sheet has fully closed
  const openSalary = useRef(false);

  // every opening starts from the applied filters, on the main list
  useEffect(() => {
    if (visible) {
      setDraft(resolveJobFilters(saved));
      setStep(initialStep);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // radio lists = one choice per filter; tapping the picked one clears it
  const toggle = (key, v) =>
    setDraft((d) => {
      const list = d[key] || [];
      return { ...d, [key]: list.includes(v) ? [] : [v] };
    });

  const current = step ? STEPS[step] : null;

  return (
    <FloatingSheet
      visible={visible}
      onDismiss={step && !initialStep ? () => setStep(null) : onDismiss}
      title={current ? current.title : "Filters"}
      subtitle={current ? current.subtitle : "Find the perfect fit for you!"}
      closeIconSize={16}
      closeIconColor="muted"
      subtitleTrim={-4.9}
      onClosed={() => {
        if (!openSalary.current) return;
        openSalary.current = false;
        navigation.navigate("JobSalaryRange");
      }}
    >
      {current ? (
        <>
          <OptionList multi options={current.options} selected={draft[step]} onToggle={(v) => toggle(step, v)} />
          <SheetFooter
            onClear={() => setDraft((d) => ({ ...d, [step]: [] }))}
            onConfirm={() => {
              if (initialStep) {
                dispatch(setJobFilters({ ...draft, status: resolveJobFilters(saved).status }));
                onDismiss();
              } else setStep(null);
            }}
          />
        </>
      ) : (
        <>
          <View>
            <SheetListRow label="Employment Type" trailing="chevron" value={summary(draft.types)} onPress={() => setStep("types")} />
            <SheetListRow
              label="Work Arrangement"
              trailing="chevron"
              value={summary(draft.modes, (v) => WORK_ARRANGEMENTS.find((w) => w.value === v)?.label || v)}
              onPress={() => setStep("modes")}
            />
            <SheetListRow label="Work Schedule" trailing="chevron" value={summary(draft.schedules)} onPress={() => setStep("schedules")} />
            <SheetListRow
              label="Salary Range"
              trailing="chevron"
              value={draft.salary ? `${k(draft.salary[0])}–${k(draft.salary[1])}` : ""}
              onPress={() => {
                // keep what was picked here, then edit the range on its screen
                dispatch(setJobFilters({ ...draft, status: resolveJobFilters(saved).status }));
                openSalary.current = true;
                onDismiss();
              }}
            />
          </View>
          <SheetFooter
            onClear={() => setDraft({ ...DEFAULT_JOB_FILTERS, status: draft.status })}
            onConfirm={() => {
              dispatch(setJobFilters({ ...draft, status: resolveJobFilters(saved).status }));
              onDismiss();
            }}
          />
        </>
      )}
    </FloatingSheet>
  );
};

export default JobFiltersSheet;
