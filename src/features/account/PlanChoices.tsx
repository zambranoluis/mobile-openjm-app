import { Alert, View } from "react-native";
import { Button, Copy, Title } from "../../ui/controls";
import type { Plan } from "./planModel";
export function PlanChoices({
  plans,
  busy,
  purchase,
  subscribe,
  cancel,
}: {
  plans: Plan[];
  busy: boolean;
  purchase: (plan: Plan) => void;
  subscribe: (plan: Plan) => void;
  cancel: () => void;
}) {
  return (
    <>
      <Title localize>Plans</Title>
      {plans.length === 0 && <Copy muted>No plan choices were returned.</Copy>}
      {plans.map((plan) => (
        <View key={plan.tier} style={{ gap: 12 }}>
          <Copy>
            {plan.name}
            {plan.current ? " · current" : ""}
          </Copy>
          {plan.description && <Copy muted>{plan.description}</Copy>}
          {plan.priceCents !== null && plan.currency && (
            <Copy>
              {plan.priceCents / 100} {plan.currency}
              {plan.interval ? ` / ${plan.interval}` : ""}
            </Copy>
          )}
          {plan.weeklyHours !== null && (
            <Copy muted>{plan.weeklyHours} hours per week</Copy>
          )}
          {plan.features.map((feature) => (
            <Copy key={feature} muted>
              {feature}
            </Copy>
          ))}
          {plan.purchasable ? (
            <>
              <Button
                label={`Buy ${plan.name} with account credit`}
                disabled={busy}
                onPress={() =>
                  Alert.alert(
                    `Buy ${plan.name}?`,
                    `Use ${plan.priceCents! / 100} ${plan.currency} from your account balance. OpenJM will confirm availability and the final charge.`,
                    [
                      { text: "Keep current plan", style: "cancel" },
                      {
                        text: "Confirm purchase",
                        onPress: () => purchase(plan),
                      },
                    ],
                  )
                }
              />
              <Button
                label={`Subscribe to ${plan.name}`}
                secondary
                disabled={busy}
                onPress={() => subscribe(plan)}
              />
            </>
          ) : (
            <Copy muted>
              {plan.unavailableReason ??
                (plan.tier === "free"
                  ? "Free plan"
                  : "Purchase is unavailable for this account.")}
            </Copy>
          )}
        </View>
      ))}
      <Button
        label="Cancel subscription"
        secondary
        disabled={busy}
        onPress={() =>
          Alert.alert(
            "Cancel subscription?",
            "OpenJM will determine the cancellation date and remaining access. Refresh billing to see the confirmed state.",
            [
              { text: "Keep subscription", style: "cancel" },
              {
                text: "Confirm cancellation",
                style: "destructive",
                onPress: cancel,
              },
            ],
          )
        }
      />
    </>
  );
}
