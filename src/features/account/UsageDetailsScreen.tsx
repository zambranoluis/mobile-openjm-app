import { useCallback, useRef, useState } from "react";
import { View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Row,
  Screen,
  Title,
} from "../../ui/controls";
import { usageDetails, usageWindow } from "./usageDetailsModel";
import type { UsageEvent } from "./usageDetailsModel";
type Query = {
  from: string;
  to: string;
  model: string;
  kind: string;
  tier: string;
  stream: string;
  token_source: string;
  finish_reason: string;
};
function initial(): Query {
  const now = Date.now();
  return {
    from: new Date(now - 7 * 86400000).toISOString(),
    to: new Date(now).toISOString(),
    model: "",
    kind: "",
    tier: "",
    stream: "",
    token_source: "",
    finish_reason: "",
  };
}
export function UsageDetailsScreen() {
  const [query, setQuery] = useState(initial);
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [partial, setPartial] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const applied = useRef<Query | null>(null),
    revision = useRef(0);
  const pendingRead = useRef<number | null>(null);
  const read = useCallback(async (filter: Query, offset: number) => {
    if (pendingRead.current === revision.current) return;
    const expected = ++revision.current;
    pendingRead.current = expected;
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        ...usageWindow(filter.from, filter.to),
        limit: "25",
        offset: String(offset),
      });
      for (const [key, value] of Object.entries(filter))
        if (key !== "from" && key !== "to" && value.trim())
          params.set(key, value.trim());
      const page = usageDetails(
        await api.request(`/v1/usage/details?${params}`),
        offset,
      );
      if (expected !== revision.current) return;
      setEvents((previous) =>
        offset === 0
          ? page.data
          : [
              ...previous,
              ...page.data.filter(
                (item) => !previous.some((existing) => existing.id === item.id),
              ),
            ],
      );
      setNext(page.nextOffset);
      setPartial(page.partial);
      applied.current = { ...filter };
      setLoaded(true);
    } catch (failure) {
      if (expected === revision.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "Could not load usage details.",
        );
    } finally {
      if (pendingRead.current === expected) pendingRead.current = null;
      if (expected === revision.current) setBusy(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void read(applied.current ?? initial(), 0);
      return () => {
        revision.current++;
      };
    }, [read]),
  );
  function field(
    key: "from" | "to" | "model" | "finish_reason",
    label: string,
  ) {
    return (
      <Field
        label={label}
        value={query[key]}
        onChangeText={(value) =>
          setQuery((previous) => ({ ...previous, [key]: value }))
        }
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
      />
    );
  }
  function options(
    key: "kind" | "tier" | "stream" | "token_source",
    label: string,
    values: string[],
  ) {
    return (
      <View style={{ gap: 8 }}>
        <Copy>{label}</Copy>
        {["", ...values].map((value) => (
          <Button
            key={value}
            label={`${query[key] === value ? "Selected: " : ""}${value || `All ${label.toLowerCase()}`}`}
            secondary
            disabled={busy}
            onPress={() =>
              setQuery((previous) => ({ ...previous, [key]: value }))
            }
          />
        ))}
      </View>
    );
  }
  return (
    <Screen>
      <Title localize>Usage details</Title>
      <Button
        label={showFilters ? "Hide usage filters" : "Refine usage filters"}
        secondary
        disabled={busy}
        onPress={() => setShowFilters((current) => !current)}
      />
      {showFilters && (
        <>
          <Copy muted>
            Dates use ISO format. Apply filters to refresh this account’s
            recorded activity.
          </Copy>
          {field("from", "From (ISO date)")}
          {field("to", "To (ISO date)")}
          {field("model", "Model filter")}
          {options("kind", "Kinds", ["chat", "embedding", "job"])}
          {options("tier", "Tiers", ["free", "paid", "anon"])}
          {options("stream", "Response modes", ["streaming", "non-streaming"])}
          {options("token_source", "Token sources", [
            "upstream",
            "estimated",
            "missing",
            "unreached",
          ])}
          {field("finish_reason", "Finish reason filter")}
          <Button
            label="Apply usage filters"
            busy={busy}
            onPress={() => void read(query, 0)}
          />
        </>
      )}
      <Button
        label="Refresh activity"
        secondary
        busy={busy}
        onPress={() => void read(applied.current ?? query, 0)}
      />
      <Feedback message={error} />
      {partial && (
        <Copy muted>
          Upstream synchronization is incomplete. These records are a partial
          result.
        </Copy>
      )}
      {loaded && !events.length && (
        <Copy muted>No usage events were returned for these filters.</Copy>
      )}
      {events.map((event) => (
        <View key={event.id} style={{ gap: 8 }}>
          <Copy>
            {event.model} · {event.at}
          </Copy>
          <Copy muted>
            {[event.kind, event.tier, event.source, event.finish]
              .filter(Boolean)
              .join(" · ")}
          </Copy>
          {event.tokens !== null && <Copy>{event.tokens} total tokens</Copy>}
          {event.promptTokens !== null && (
            <Copy muted>{event.promptTokens} prompt tokens</Copy>
          )}
          {event.completionTokens !== null && (
            <Copy muted>{event.completionTokens} completion tokens</Copy>
          )}
          {event.costCents !== null && (
            <Copy muted>Recorded cost: {event.costCents} cents</Copy>
          )}
          {event.latency !== null && (
            <Copy muted>Latency: {event.latency} ms</Copy>
          )}
          {event.conversationId && (
            <Row
              localize
              title="Open conversation"
              onPress={() =>
                router.push({
                  pathname: "/conversation/[id]",
                  params: { id: event.conversationId! },
                })
              }
            />
          )}
        </View>
      ))}
      {next !== null && (
        <Button
          label="Load more usage events"
          secondary
          busy={busy}
          onPress={() => {
            if (applied.current) void read(applied.current, next);
          }}
        />
      )}
    </Screen>
  );
}
