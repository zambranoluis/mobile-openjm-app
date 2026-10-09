import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import { Button, Copy, Feedback, Row, Screen, Title } from "../../ui/controls";
import { usageSummary } from "./usageModel";
import { shareJson } from "../../platform/exports";
import { SensitiveAction } from "./SensitiveAction";
export function UsageScreen() {
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReturnType<
    typeof usageSummary
  > | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    try {
      setSummary(usageSummary(await api.request("/v1/usage?group_by=model")));
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not load usage.",
      );
    } finally {
      setBusy(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return (
    <Screen>
      <Title localize>Usage</Title>
      <Copy muted>Your usage is recorded by OpenJM.</Copy>
      {summary ? (
        <>
          {summary.requests !== null ? (
            <Row localize title="Requests" detail={String(summary.requests)} />
          ) : null}
          {summary.tokens !== null ? (
            <Row localize title="Tokens" detail={String(summary.tokens)} />
          ) : null}
          {summary.entries.map((row) => (
            <Row
              key={row.id}
              title={row.label}
              detail={[
                row.requests !== null ? `${row.requests} requests` : null,
                row.tokens !== null ? `${row.tokens} tokens` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
          {summary.requests === null &&
          summary.tokens === null &&
          !summary.entries.length ? (
            <Copy muted>No usage details were returned for this period.</Copy>
          ) : null}
        </>
      ) : null}
      <Feedback message={error} />
      <Row
        localize
        title="Detailed activity and filters"
        onPress={() => router.push("/account/usage-details")}
      />
      <Button
        label="Refresh usage"
        secondary
        busy={busy}
        onPress={() => void load()}
      />
      <Copy muted>
        Your export can contain private conversations and account details.
        Choose a destination you trust.
      </Copy>
      <SensitiveAction
        action="ACCOUNT_EXPORT"
        label="Save or share account export"
        disabled={busy}
        perform={async () => {
          const payload = await api.request("/v1/users/me/export");
          await shareJson(payload);
        }}
      />
    </Screen>
  );
}
