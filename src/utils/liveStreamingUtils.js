import moment from "moment";

/**
 * Live Streaming Utility Functions
 * Only functions used in live streaming features
 */

export const isValidEmail = (emailValue) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailValue);
};

export const formatChatTimestamp = (isoString) => {
  if (!isoString) return "";

  const date = new Date(isoString);

  // Time → 04:45 pm
  const time = date
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  // Date → Mar 12, 2025
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return `${time} - ${formattedDate}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();

  // Compare dates in local timezone by using toLocaleDateString
  const dateLocalString = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayLocalString = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const isToday = dateLocalString === todayLocalString;

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayLocalString = yesterday.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const isYesterday = dateLocalString === yesterdayLocalString;

  if (isToday) {
    return "Today";
  } else if (isYesterday) {
    return "Yesterday";
  } else {
    const options = { month: "long", day: "numeric", year: "numeric" };
    return date.toLocaleDateString(undefined, options);
  }
};

export const formatInstagramTime = (date) => {
  const now = moment();
  const created = moment.utc(date).local();

  if (!created.isValid()) return "";

  const diffInSeconds = now.diff(created, "seconds");
  const diffInMinutes = now.diff(created, "minutes");
  const diffInHours = now.diff(created, "hours");
  const diffInDays = now.diff(created, "days");
  const diffInWeeks = now.diff(created, "weeks");
  const diffInMonths = now.diff(created, "months");
  const diffInYears = now.diff(created, "years");

  if (diffInSeconds < 60) return `${Math.max(0, diffInSeconds)}s`;
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;
  if (diffInWeeks < 4) return `${diffInWeeks}w`;
  if (diffInMonths < 12) return `${diffInMonths}mo`;
  return `${diffInYears}y`;
};

export const humanizeNumber = (value, label) => {
  if (!value || value === 0) {
    return label ? `0 ${label}s` : "0";
  }

  let formatted = "";

  if (value >= 1_000_000) {
    formatted = (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (value >= 1_000) {
    formatted = (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  } else {
    formatted = value.toString();
  }

  if (!label) return formatted;

  // Singular / plural handling
  if (value === 1) {
    return `${formatted} ${label}`;
  }

  return `${formatted} ${label}s`;
};

export const formatNumber = (num) => {
  if (num == null || num === "") {
    return "0";
  }
  const n = typeof num === "number" ? num : Number(num);
  if (!Number.isFinite(n)) {
    return "0";
  }
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}k`;
  }
  return String(Math.trunc(n));
};

/**
 * Format duration in seconds to readable format (HH:MM:SS)
 */
export const formatDuration = (seconds) => {
  if (typeof seconds !== "number" || seconds < 0) return "00:00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (num) => String(num).padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
};
