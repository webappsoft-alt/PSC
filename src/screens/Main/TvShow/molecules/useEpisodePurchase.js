import { usePaymentSheet } from "@stripe/stripe-react-native";
import { useCallback, useState } from "react";
import {
  confirmEpisodePurchase,
  createEpisodePurchase,
} from "../../../../services/showApi";
import { ToastMessage } from "../../../../utils/ToastMessage";

/**
 * "Buy Now" for a paid episode: PaymentIntent from the server → Stripe
 * payment sheet (same flow as GiftModal's card payment) → confirm → unlocked.
 * Returns { buy, buying }; `buy(showId, episodeId)` resolves true when paid.
 */
const useEpisodePurchase = () => {
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const [buying, setBuying] = useState(false);

  const buy = useCallback(
    async (showId, episodeId) => {
      if (buying || !showId || !episodeId) return false;
      setBuying(true);
      try {
        const created = await createEpisodePurchase(showId, episodeId);
        const { clientSecret, paymentIntentId } = created?.data?.data || {};
        if (!clientSecret) {
          ToastMessage(created?.data?.message || "Payment init failed", "error");
          return false;
        }
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: "Private Social Club",
          style: "alwaysDark",
          allowsDelayedPaymentMethods: false,
        });
        if (initError) {
          ToastMessage(initError.message || "Payment init failed", "error");
          return false;
        }
        const { error } = await presentPaymentSheet();
        if (error) {
          const code = String(error?.code ?? "").toLowerCase();
          if (!code.includes("cancel")) {
            ToastMessage(error.message || "Card payment failed", "error");
          }
          return false;
        }
        const confirmed = await confirmEpisodePurchase(showId, episodeId, paymentIntentId);
        if (confirmed?.data?.success) {
          ToastMessage("Episode unlocked", "success");
          return true;
        }
        ToastMessage(confirmed?.data?.message || "Could not confirm the payment", "error");
        return false;
      } catch (e) {
        const message =
          e?.response?.data?.message || e?.message || "Card payment failed";
        ToastMessage(message, "error");
        return false;
      } finally {
        setBuying(false);
      }
    },
    [buying, initPaymentSheet, presentPaymentSheet],
  );

  return { buy, buying };
};

export default useEpisodePurchase;
