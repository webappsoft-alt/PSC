import { navigationRef } from "../navigation/navigationRef";
import { useCallback } from "react";
import moment from "moment";
import { ToastMessage } from "../utils/ToastMessage";

const waitForNavigation = (timeout = 10000) => {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const check = () => {
      if (navigationRef.isReady()) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        console.warn("Navigation wait timeout");
        resolve(false);
      } else {
        setTimeout(check, 100);
      }
    };

    check();
  });
};

export const useNotificationNavigation = () => {
  const handleNotificationPress = useCallback(async (remoteMessage) => {
    if (!remoteMessage) return;

    // Wait for navigation to be ready (especially important for quit state)
    const isReady = await waitForNavigation();
    if (!isReady) return;

    const payload = remoteMessage?.data || remoteMessage;
    const type = payload?.type;

    let parsedMessage = null;
    if ((type === "message" || type === "text") && payload?.message) {
      try {
        parsedMessage = JSON.parse(payload.message);
      } catch (e) {
        console.error("Failed to parse notification message", e);
      }
    }

    if (type === "message" || type === "text") {
      const sender = parsedMessage?.senderId;
      if (sender) {
        navigationRef.navigate("InboxScreen", {
          recipientId: sender._id,
          recipientName: `${sender.firstName || ""} ${
            sender.lastName || ""
          }`.trim(),
          otherUser: sender,
        });
      }
    } else if (type === "comment" || type === "reaction") {
      const postId = payload?.post;
      navigationRef.navigate("DetailPageWithId", { postId });
    } else if (type === "follow" || type === "matching") {
      navigationRef.navigate("UserProfile", {
        userId: payload?.UserId,
      });
    } else if (type === "story") {
      const storyId = payload?.storyId;
      const isExpired =
        moment().diff(moment(payload?.createdAt), "hours") >= 24;
      if (isExpired) {
        ToastMessage("Story expires", "error");
      } else {
        navigationRef.navigate("StoryViewerById", { storyId });
      }
    } else if (type === "request") {
      navigationRef.navigate("RequestsScreen");
    }
  }, []);

  return { handleNotificationPress };
};
