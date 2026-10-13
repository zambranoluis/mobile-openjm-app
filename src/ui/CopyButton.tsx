import { useState } from "react";
import { copyText } from "../platform/clipboard";
import { Button, Feedback } from "./controls";
export function CopyButton({ value, label = "Copy response" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false), [error, setError] = useState<string | null>(null);
  return <>
    <Button secondary label={copied ? "Copied" : label} onPress={() => {
      void copyText(value).then(() => { setCopied(true); setError(null); })
        .catch((failure: unknown) => setError(failure instanceof Error ? failure.message : "Could not copy text."));
    }} />
    <Feedback message={error} />
  </>;
}
