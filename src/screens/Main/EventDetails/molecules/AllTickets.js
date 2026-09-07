import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import React, { useState, useMemo, useEffect } from "react";
import TicketsHeading from "./TicketsHeading";
import TicketCard from "./TicketCard";
import CustomText from "../../../../components/CustomText";
import moment from "moment";
import { COLORS } from "../../../../utils/COLORS";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import { useTheme } from "../../../../contexts/ThemeContext";

const AllTickets = ({ ticketing, id, onPayloadChange, address }) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const ticketsDetail = ticketing?.ticketsDetails ?? [];

  const eventId = id;

  const dateOptions = useMemo(() => {
    const uniqueDates = Array.from(
      new Set(ticketsDetail.map((t) => t.startDate)),
    );
    return uniqueDates.map((date, index) => {
      const ticketsForDate = ticketsDetail.filter((t) => t.startDate === date);
      const startTimes = ticketsForDate.map((t) => t.startTime).sort();
      const endTimes = ticketsForDate.map((t) => t.endTime).sort();
      return {
        id: index.toString(),
        date,
        startTime: startTimes[0],
        endTime: endTimes[endTimes.length - 1],
      };
    });
  }, [ticketsDetail]);

  const [selectedDateId, setSelectedDateId] = useState(
    dateOptions?.[0]?.id ?? null,
  );

  const [quantities, setQuantities] = useState({});

  const filteredTickets = useMemo(() => {
    const selectedDate = dateOptions.find((d) => d.id === selectedDateId)?.date;
    return ticketsDetail.filter((t) => t.startDate === selectedDate);
  }, [selectedDateId, ticketsDetail, dateOptions]);

  const onIncrement = (id, max) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      if (current >= max) return prev;
      return { ...prev, [id]: current + 1 };
    });
  };
  const onDecrement = (id) =>
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max((prev[id] || 0) - 1, 0),
    }));

  const updateParentPayload = (updatedQty = quantities) => {
    const selectedDate = dateOptions.find((d) => d.id === selectedDateId)?.date;
    const ticketsPayload = ticketsDetail
      .filter((t) => t.startDate === selectedDate)
      .map((t) => ({
        date: t.startDate,
        ticket: t._id,
        quantity: updatedQty[t._id] || 0,
        startTime: t._startTime,
        endTime: t._endTime,
      }));

    const totalQuantity = ticketsPayload.reduce(
      (sum, t) => sum + t.quantity,
      0,
    );
    const subTotal = ticketsPayload.reduce((sum, t) => {
      const ticket = ticketsDetail.find((td) => td._id === t.ticket);
      return sum + ticket.ticketPrice * t.quantity;
    }, 0);

    const payload = {
      eventId,
      totalQuantity,
      tickets: ticketsPayload,
      subTotal,
      discount: 0,
      finalPrice: subTotal,
      promoCode: "SUMMER10",
    };

    onPayloadChange?.(payload);
  };
  const selectedDateObj = useMemo(() => {
    return dateOptions.find((d) => d.id === selectedDateId);
  }, [selectedDateId, dateOptions]);

  const dayIndex = dateOptions.findIndex((d) => d.id === selectedDateId) + 1;
  useEffect(() => {
    updateParentPayload();
  }, [selectedDateId, quantities]);

  const formatTo12Hour = (time) => {
    if (!time) return "";
    return moment(time, "HH:mm").format("hh:mm A");
  };

  return (
    <View>
      <TicketsHeading
        title="All Tickets"
        subTitle="Choose specific dates and ticket combinations"
      />

      <View style={styles.datesContainer}>
        <FlatList
          data={dateOptions}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 4, paddingRight: 12 }}
          renderItem={({ item }) => {
            const isActive = item.id === selectedDateId;
            return (
              <TouchableOpacity
                onPress={() => setSelectedDateId(item.id)}
                style={[
                  styles.dateBox,
                  { backgroundColor: isActive ? colors.text : colors.surfaceAlt },
                ]}
              >
                <CustomText
                  label={moment(item.date).format("MMM DD, YYYY")}
                  color={isActive ? (isDark ? COLORS.black : colors.background) : colors.text}
                  textAlign="center"
                  fontSize={12}
                  fontFamily={fonts.medium}
                />
                <CustomText
                  label={`${formatTo12Hour(item.startTime)} - ${formatTo12Hour(
                    item.endTime,
                  )}`}
                  color={isActive ? (isDark ? "#1212127A" : colors.textSecondary) : colors.iconMuted}
                  textAlign="center"
                  fontSize={10}
                />
              </TouchableOpacity>
            );
          }}
        />
      </View>
      {selectedDateObj && (
        <View style={styles.dayCard}>
          {/* LEFT DATE BADGE */}
          <View style={styles.dateBadge}>
            <CustomText
              label={moment(selectedDateObj.date).format("MMM").toUpperCase()}
              fontSize={16}
              color={colors.iconMuted}
            />
            <CustomText
              label={moment(selectedDateObj.date).format("DD")}
              fontSize={30}
              fontFamily={fonts.semiBold}
              color={colors.text}
            />
          </View>

          {/* RIGHT DETAILS */}
          <View style={{ marginLeft: 14, flex: 1 }}>
            <CustomText
              label={`DAY - ${dayIndex}`}
              fontSize={22}
              fontFamily={fonts.semiBold}
              color={colors.text}
              marginBottom={2}
            />

            <View style={styles.infoRow}>
              <Image source={Images.TClock} style={{ height: 12, width: 12, tintColor: colors.text }} />
              <CustomText
                label={`${formatTo12Hour(
                  selectedDateObj.startTime,
                )} - ${formatTo12Hour(selectedDateObj.endTime)}`}
                fontSize={12}
                color={colors.iconMuted}
              />
            </View>

            <View style={styles.infoRow}>
              <Image
                source={Images.TLocation}
                style={{ height: 12, width: 12, tintColor: colors.text }}
              />
              <CustomText label={address} fontSize={12} color={colors.iconMuted} />
            </View>
          </View>
        </View>
      )}

      <View style={{ marginHorizontal: 12, marginBottom: 12 }}>
        {filteredTickets.map((t) => (
          <TicketCard
            key={t._id}
            title={t.ticketName}
            pricePerPerson={t.ticketPrice}
            subtitle={t.ticketDescription}
            note={t.includeExtra?.join(", ")}
            isSoldOut={t.availableTickets <= 0}
            quantity={quantities[t._id] || 0}
            onIncrement={() => onIncrement(t._id, t.availableTickets)}
            onDecrement={() => onDecrement(t._id)}
            date={t.startDate}
            startTime={t.startTime}
            endTime={t.endTime}
            totalQuantity={t.availableTickets}
          />
        ))}
      </View>
    </View>
  );
};

export default AllTickets;

const createStyles = (colors, isDark) => StyleSheet.create({
  dateBox: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  datesContainer: {
    backgroundColor: colors.surfaceAlt,
    padding: 4,
    borderRadius: 12,
    marginHorizontal: 12,
    justifyContent: "center",
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 14,
  },

  dateBadge: {
    width: 64,
    height: 74,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    padding: 8,
  },

  infoRow: {
    marginTop: 4,
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
});
