import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";
import { api } from "../../platform/runtime";
import { openCheckout } from "../../platform/checkout";
import { amountInCents, balance as readBalance } from "./billingModel";
import { currentPlan, giftCardCode, planCatalog } from "./planModel";
import type { Plan } from "./planModel";
import { PlanChoices } from "./PlanChoices";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Screen,
  Title,
} from "../../ui/controls";
type Balance = ReturnType<typeof readBalance>;
export function BillingScreen() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [plan, setPlan] = useState<ReturnType<typeof currentPlan> | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const operation = useRef(false);
  const revision = useRef(0);
  const load = useCallback(async () => {
    const currentRevision = ++revision.current;
    setBusy(true);
    const [credits, current, choices] = await Promise.allSettled([
      api.request("/v1/credits"),
      api.request("/v1/me/plan"),
      api.request("/v1/me/plans"),
    ]);
    if (currentRevision !== revision.current) return;
    if (credits.status === "fulfilled" && current.status === "fulfilled") {
      setBalance(readBalance(credits.value));
      setPlan(currentPlan(current.value));
      setError(null);
    } else {
      setBalance(null);
      setPlan(null);
      const failure =
        credits.status === "rejected"
          ? credits.reason
          : current.status === "rejected"
            ? current.reason
            : null;
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not refresh billing.",
      );
    }
    try {
      if (choices.status === "rejected") throw choices.reason;
      setPlans(planCatalog(choices.value));
      setPlansError(null);
    } catch (failure) {
      setPlans([]);
      setPlansError(
        failure instanceof Error
          ? failure.message
          : "Could not load plan choices.",
      );
    }
    setBusy(false);
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        revision.current++;
      };
    }, [load]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void load();
    });
    return () => subscription.remove();
  }, [load]);
  async function checkout() {
    if (operation.current || busy) return;
    operation.current = true;
    setCheckoutBusy(true);
    setError(null);
    setNotice(null);
    try {
      const amount_cents = amountInCents(amount);
      const payload = await api.request("/v1/credits/topup", {
        method: "POST",
        body: JSON.stringify({ amount_cents }),
      });
      await openCheckout(payload);
      setNotice(
        "Checkout closed. Refreshed account state determines whether payment completed.",
      );
      await load();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not open checkout.",
      );
    } finally {
      operation.current = false;
      setCheckoutBusy(false);
    }
  }
  async function change(
    action: "purchase" | "subscribe" | "cancel" | "redeem",
    chosen?: Plan,
  ) {
    if (operation.current || busy) return;
    if (
      (action === "purchase" || action === "subscribe") &&
      (!chosen?.purchasable || chosen.tier === "free")
    )
      return;
    operation.current = true;
    setCheckoutBusy(true);
    setError(null);
    setNotice(null);
    try {
      const path =
        action === "redeem"
          ? "/v1/credits/redeem"
          : action === "purchase"
            ? "/v1/me/plan/purchase"
            : "/v1/me/subscription";
      const payload = await api.request(path, {
        method: action === "cancel" ? "DELETE" : "POST",
        ...(action === "cancel"
          ? {}
          : {
              body: JSON.stringify(
                action === "redeem"
                  ? { code: giftCardCode(code) }
                  : { tier: chosen!.tier },
              ),
            }),
      });
      if (action === "subscribe") {
        await openCheckout(payload);
        setNotice(
          "Checkout closed. Refreshed account state determines whether the subscription started.",
        );
      } else {
        if (action === "redeem") setCode("");
        setNotice(
          action === "redeem"
            ? "Gift card redeemed. Refreshing your balance."
            : action === "cancel"
              ? "Cancellation accepted. Refreshing subscription state."
              : "Purchase accepted. Refreshing your plan and balance.",
        );
      }
      await load();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The billing change could not be confirmed. Refresh before trying again.",
      );
    } finally {
      operation.current = false;
      setCheckoutBusy(false);
    }
  }
  return (
    <Screen>
      <Title localize>Account balance</Title>
      <Feedback message={error} />
      {balance ? (
        <Copy>
          {balance.cents !== null
            ? `${balance.cents / 100} ${balance.currency ?? ""}`
            : balance.credits !== null
              ? `${balance.credits} credits`
              : "Balance details are not available in this response."}
        </Copy>
      ) : null}
      {plan?.name ? <Copy>{plan.name}</Copy> : null}
      {plan?.status && <Copy muted>State: {plan.status}</Copy>}
      {plan?.paidUntil && <Copy muted>Paid until: {plan.paidUntil}</Copy>}
      {plan?.renewsAt && <Copy muted>Renews: {plan.renewsAt}</Copy>}
      {notice && <Copy>{notice}</Copy>}
      <Copy muted>
        Billing state comes from your OpenJM account. A checkout return alone
        does not confirm a payment.
      </Copy>
      <Field
        label={`Top-up amount${balance?.currency ? ` (${balance.currency})` : ""}`}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        editable={!checkoutBusy}
      />
      <Button
        label="Open secure checkout"
        busy={checkoutBusy}
        disabled={!amount.trim() || busy || !balance?.currency}
        onPress={() => void checkout()}
      />
      <Button
        label="Refresh billing"
        secondary
        busy={busy}
        onPress={() => void load()}
      />
      <Field
        label="Gift card code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!checkoutBusy}
      />
      <Button
        label="Redeem gift card"
        busy={checkoutBusy}
        disabled={busy || !code.trim()}
        onPress={() => void change("redeem")}
      />
      <Feedback message={plansError} />
      <PlanChoices
        plans={plans}
        busy={busy || checkoutBusy}
        purchase={(plan) => void change("purchase", plan)}
        subscribe={(plan) => void change("subscribe", plan)}
        cancel={() => void change("cancel")}
      />
    </Screen>
  );
}
