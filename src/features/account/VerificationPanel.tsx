import { useEffect, useState } from "react";
import { Button, Copy, Field } from "../../ui/controls";
import type { Challenge } from "./securityModel";
export function VerificationPanel({
  challenge,
  busy,
  onVerify,
  onResend,
  onCancel,
  verifyLabel = "Confirm change",
}: {
  challenge: Challenge;
  busy: boolean;
  onVerify: (code: string) => void;
  onResend: () => void;
  onCancel: () => void;
  verifyLabel?: string;
}) {
  const [code, setCode] = useState("");
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(
    0,
    Math.ceil((Date.parse(challenge.resendAvailableAt) - now) / 1000),
  );
  const expired = Date.parse(challenge.expiresAt) <= now;
  return (
    <>
      <Copy>
        Enter the verification code sent to {challenge.destinationHint}.
      </Copy>
      {expired && (
        <Copy muted>This code has expired. Request a fresh code.</Copy>
      )}
      <Field
        label="Verification code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        maxLength={6}
        editable={!busy}
      />
      <Button
        label={verifyLabel}
        busy={busy}
        disabled={expired || !/^\d{6}$/.test(code)}
        onPress={() => onVerify(code)}
      />
      <Button
        label={
          seconds ? `Send another code in ${seconds}s` : "Send another code"
        }
        secondary
        disabled={busy || seconds > 0}
        onPress={onResend}
      />
      <Button
        label="Cancel change"
        secondary
        disabled={busy}
        onPress={onCancel}
      />
    </>
  );
}
