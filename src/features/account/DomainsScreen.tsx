import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Screen,
  Title,
} from "../../ui/controls";
import { domainInput, domainState } from "./domainModel";
import type { DomainState } from "./domainModel";
export function DomainsScreen() {
  const [domain, setDomain] = useState(""),
    [state, setState] = useState<DomainState | null>(null);
  const [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const [advanced, setAdvanced] = useState(false),
    [challengeId, setChallengeId] = useState(""),
    [txt, setTxt] = useState("");
  const revision = useRef(0),
    pending = useRef<number | null>(null);
  useFocusEffect(
    useCallback(() => {
      setBusy(false);
      return () => {
        revision.current++;
      };
    }, []),
  );
  async function run(action: "load" | "create" | "verify" | "advanced") {
    if (pending.current === revision.current) return;
    const expected = ++revision.current;
    pending.current = expected;
    setBusy(true);
    setError(null);
    try {
      const target = domainInput(domain);
      const path =
        action === "advanced"
          ? "/v1/domains/verify"
          : `/v1/domains/challenges${action === "create" ? "" : `/${encodeURIComponent(target)}${action === "verify" ? "/verify" : ""}`}`;
      const body =
        action === "create"
          ? { domain: target }
          : action === "advanced"
            ? {
                domain: target,
                ...(challengeId.trim()
                  ? { challenge_id: challengeId.trim() }
                  : {}),
                ...(txt.trim() ? { txt_record_value: txt.trim() } : {}),
              }
            : null;
      const result = domainState(
        await api.request(path, {
          method: action === "load" ? "GET" : "POST",
          ...(body ? { body: JSON.stringify(body) } : {}),
        }),
      );
      if (expected === revision.current) {
        setState(result);
        setDomain(result.domain);
      }
    } catch (failure) {
      if (expected === revision.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "Domain verification could not be confirmed.",
        );
    } finally {
      if (pending.current === expected) pending.current = null;
      if (expected === revision.current) setBusy(false);
    }
  }
  return (
    <Screen>
      <Title localize>Verify a domain</Title>
      <Copy muted>
        Publish the exact DNS record supplied by OpenJM. Verification may remain
        pending while DNS changes propagate.
      </Copy>
      <Field
        label="Domain name"
        value={domain}
        onChangeText={(value) => {
          setDomain(value);
          setState(null);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
      />
      <Feedback message={error} />
      <Button
        label="Load saved domain challenge"
        secondary
        busy={busy}
        onPress={() => void run("load")}
      />
      <Button
        label="Request new DNS challenge"
        busy={busy}
        onPress={() => void run("create")}
      />
      {state && (
        <>
          <Copy>
            {state.domain}:{" "}
            {state.status === "verified"
              ? "Verified by OpenJM"
              : "Verification pending"}
          </Copy>
          <Copy muted>Challenge: {state.challengeId}</Copy>
          {state.name && <Copy>DNS name: {state.name}</Copy>}
          {state.type && <Copy>Record type: {state.type}</Copy>}
          {state.value && <Copy>Record value: {state.value}</Copy>}
          {state.expiresAt && <Copy muted>Expires: {state.expiresAt}</Copy>}
          {state.verifiedAt && <Copy muted>Verified: {state.verifiedAt}</Copy>}
          {state.status === "pending" && (
            <Button
              label="Check saved DNS challenge"
              busy={busy}
              onPress={() => void run("verify")}
            />
          )}
        </>
      )}
      <Button
        label={
          advanced ? "Hide manual verification" : "Use manual challenge details"
        }
        secondary
        disabled={busy}
        onPress={() => setAdvanced((value) => !value)}
      />
      {advanced && (
        <>
          <Field
            label="Challenge ID (optional)"
            value={challengeId}
            onChangeText={setChallengeId}
            autoCapitalize="none"
            editable={!busy}
            maxLength={512}
          />
          <Field
            label="TXT record value (optional)"
            value={txt}
            onChangeText={setTxt}
            autoCapitalize="none"
            editable={!busy}
            maxLength={4096}
          />
          <Button
            label="Submit manual domain verification"
            busy={busy}
            onPress={() => void run("advanced")}
          />
        </>
      )}
    </Screen>
  );
}
