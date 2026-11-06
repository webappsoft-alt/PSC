import { StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import {
  JOB_STATUS_STYLE,
  MATCH_BADGE,
  companyLogo,
  companyName,
  formatSalary,
} from "../../../../utils/career";
import { Dot, LogoBox, MSF, WHITE_16, WHITE_4, WHITE_48, WHITE_64, X } from "../../Career/molecules/CareerUI";

const BLUE = "rgba(0, 123, 255, 1)";

/** Figma chip 20h padding 0/6 r4: white 4% + Medium 10 white 48% (or badge colours) */
export const Chip = ({ label, bg = WHITE_4, color = WHITE_48, semiBold }) => (
  <View style={[styles.chip, { backgroundColor: bg }]}>
    <CustomText
      label={label}
      fontSize={10}
      letterSpacing={semiBold ? -0.05 : 0}
      fontFamily={semiBold ? fonts.semiBold : fonts.medium}
      textTransform="uppercase"
      color={color}
    />
  </View>
);

/**
 * Figma Matching/Jobs › job card component "Frame 2085664205" (7470:5863),
 * 335/359 wide, column gap 8:
 *  · header row 56, gap 8: 56 r12 logo · column 56 tall, centred, gap 4 —
 *    title SemiBold 14 (12 trimmed); row gap 2: `domain` 10 white 64% +
 *    company Medium 10 −3% white; row gap 2: `location_on` 10 blue +
 *    "Geneva, CH" Regular 10 −4% white 64% · 3pt dot white 16% · "Remote";
 *    row gap 4: 12 avatar · (gap 2) "Viktor" Medium 10 −3% white + "& 3
 *    others" Regular 10 −4% white 64%
 *  · chips row gap 4: 20h p0/6 r4 — "90% MATCH" SemiBold 10 −0.5% #1D9053 on
 *    #37B874 16%; others Medium 10 white 48% on white 4%
 *  · column gap 12: description Regular 12 white 64% (2 lines) · salary row
 *    gap 4: "USD 96K-110K" SemiBold 14 −3% white | 1×10 white 16% | "Yearly"
 *    Medium 14 −3% white 64%.
 */
const JobCard = ({ job, mine, onPress }) => {
  const status = JOB_STATUS_STYLE[job.status] || JOB_STATUS_STYLE.active;
  const poster = job.postedBy && typeof job.postedBy === "object" ? job.postedBy : null;
  const others = Math.max(0, (job.candidatesCount || 0) - (job.applied ? 1 : 0));
  const salary = formatSalary(job.salary);
  const place = [job.location?.city, job.location?.country].filter(Boolean).join(", ");

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <LogoBox uri={companyLogo(job)} name={companyName(job)} size={mine ? 51 : 56} radius={12} />
        <View style={[styles.headerColumn, { minHeight: mine ? 51 : 56 }]}>
          <CustomText
            label={job.title}
            fontSize={14}
            fontFamily={fonts.semiBold}
            color="#FFFFFF"
            numberOfLines={1}
            marginTop={-X(14)}
            marginBottom={-X(14)}
          />
          <View style={styles.metaRow2}>
            <Icons family={MSF} name="domain" size={10} color={WHITE_64} />
            <CustomText
              label={companyName(job)}
              fontSize={10}
              letterSpacing={-0.3}
              fontFamily={fonts.medium}
              color="#FFFFFF"
              numberOfLines={1}
              marginTop={-X(10)}
              marginBottom={-X(10)}
              containerStyle={styles.shrink}
            />
          </View>
          {(!!place || !!job.workMode) && (
            <View style={styles.metaRow2}>
              <Icons family={MSF} name="location_on" size={10} color={BLUE} />
              {!!place && (
                <CustomText
                  label={place}
                  fontSize={10}
                  letterSpacing={-0.4}
                  color={WHITE_64}
                  numberOfLines={1}
                  marginTop={-X(10)}
                  marginBottom={-X(10)}
                />
              )}
              {!!place && !!job.workMode && <Dot color={WHITE_16} />}
              {!!job.workMode && (
                <CustomText
                  label={job.workMode}
                  fontSize={10}
                  letterSpacing={-0.4}
                  color={WHITE_64}
                  marginTop={-X(10)}
                  marginBottom={-X(10)}
                />
              )}
            </View>
          )}
          {mine ? (
            // Figma My-Job-Offers: "16 Candidates" · 4 · "8 Approved" (each gap 2)
            <View style={styles.metaRow}>
              <View style={styles.metaRow2}>
                <CustomText label={String(job.candidatesCount || 0)} fontSize={10} letterSpacing={-0.3} fontFamily={fonts.medium} color="#FFFFFF" marginTop={-X(10)} marginBottom={-X(10)} />
                <CustomText label="Candidates" fontSize={10} letterSpacing={-0.4} color={WHITE_64} marginTop={-X(10)} marginBottom={-X(10)} />
              </View>
              <View style={styles.metaRow2}>
                <CustomText label={String(job.preselectedCount || 0)} fontSize={10} letterSpacing={-0.3} fontFamily={fonts.medium} color="#FFFFFF" marginTop={-X(10)} marginBottom={-X(10)} />
                <CustomText label="Approved" fontSize={10} letterSpacing={-0.4} color={WHITE_64} marginTop={-X(10)} marginBottom={-X(10)} />
              </View>
            </View>
          ) : (
            !!poster && (
              <View style={styles.metaRow}>
                <View style={[styles.avatar, { backgroundColor: poster.profile?.profileColor || WHITE_4 }]}>
                  {!!poster.profile?.avatar && (
                    <ImageFast source={{ uri: poster.profile.avatar }} style={styles.avatarImg} />
                  )}
                </View>
                <View style={styles.metaRow2}>
                  <CustomText
                    label={poster.firstName || poster.username || ""}
                    fontSize={10}
                    letterSpacing={-0.3}
                    fontFamily={fonts.medium}
                    color="#FFFFFF"
                    numberOfLines={1}
                    marginTop={-X(10)}
                    marginBottom={-X(10)}
                  />
                  {others > 0 && (
                    <CustomText
                      label={`& ${others} ${others === 1 ? "other" : "others"}`}
                      fontSize={10}
                      letterSpacing={-0.4}
                      color={WHITE_64}
                      marginTop={-X(10)}
                      marginBottom={-X(10)}
                    />
                  )}
                </View>
              </View>
            )
          )}
        </View>
        {mine && <Chip label={status.label} bg={status.bg} color={status.color} semiBold />}
      </View>

      <View style={styles.chips}>
        {!mine && job.match != null && job.match > 0 && (
          <Chip label={`${job.match}% match`} bg={MATCH_BADGE.bg} color={MATCH_BADGE.color} semiBold />
        )}
        {!!job.employmentType && <Chip label={job.employmentType} />}
        {/* level (older offers) or the required experience (New Job Offer form) */}
        {!!(job.level || (job.experience && job.experience !== "None")) && <Chip label={job.level || job.experience} />}
        {(job.tags || []).slice(0, 4).map((t) => (
          <Chip key={t} label={t} />
        ))}
      </View>

      <View style={styles.bottom}>
      {!!job.description && (
        <CustomText
          label={job.description}
          fontSize={12}
          color={WHITE_64}
          numberOfLines={2}
          marginTop={-X(12)}
          marginBottom={-X(12)}
        />
      )}

      {!!salary && (
        <View style={styles.salaryRow}>
          <CustomText
            label={salary}
            fontSize={14}
            letterSpacing={-0.42}
            fontFamily={fonts.semiBold}
            color="#FFFFFF"
            marginTop={-X(14)}
            marginBottom={-X(14)}
          />
          <View style={styles.bar} />
          <CustomText
            label={job.salary?.period || "Yearly"}
            fontSize={14}
            letterSpacing={-0.42}
            fontFamily={fonts.medium}
            color={WHITE_64}
            marginTop={-X(14)}
            marginBottom={-X(14)}
          />
        </View>
      )}
      </View>
    </TouchableOpacity>
  );
};

export default JobCard;

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  card: { gap: 8 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  headerColumn: { flex: 1, justifyContent: "center", gap: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaRow2: { flexDirection: "row", alignItems: "center", gap: 2, flexShrink: 1 },
  bottom: { gap: 12 },
  statGap: { width: 4 },
  avatar: { width: 12, height: 12, borderRadius: 100, overflow: "hidden" },
  avatarImg: { width: 12, height: 12 },
  // Figma "Menu - Library": one 20pt row (extra chips are clipped, not wrapped)
  chips: { flexDirection: "row", gap: 4, height: 20, overflow: "hidden" },
  chip: {
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  salaryRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  bar: { width: 1, height: 10, backgroundColor: WHITE_16 },
});
