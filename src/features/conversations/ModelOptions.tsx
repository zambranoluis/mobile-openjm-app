import { Switch } from "react-native";
import type { Model } from "../../api/types";
import { Button, Copy } from "../../ui/controls";
export type ChatOptions = {
  thinking: boolean;
  webSearch: boolean;
  complex: boolean;
};
export function chatOptions(model: Model | undefined, options: ChatOptions) {
  return {
    ...(model?.capabilities?.reasoning === true
      ? { thinking: options.thinking }
      : {}),
    ...(model?.capabilities?.web_search === true && options.webSearch
      ? { web_search: { enabled: true } }
      : {}),
    complexity_mode: options.complex ? "complex" : "auto",
  };
}
export function ModelOptions({
  model,
  value,
  onChange,
  disabled,
}: {
  model: Model | undefined;
  value: ChatOptions;
  onChange: (value: ChatOptions) => void;
  disabled: boolean;
}) {
  return (
    <>
      {model?.capabilities?.reasoning === true && (
        <>
          <Copy>Use reasoning</Copy>
          <Switch
            accessibilityLabel="Use reasoning"
            value={value.thinking}
            disabled={disabled}
            onValueChange={(thinking) => onChange({ ...value, thinking })}
          />
        </>
      )}
      {model?.capabilities?.web_search === true && (
        <>
          <Copy>Search the web for this response</Copy>
          <Switch
            accessibilityLabel="Search the web for this response"
            value={value.webSearch}
            disabled={disabled}
            onValueChange={(webSearch) => onChange({ ...value, webSearch })}
          />
        </>
      )}
      <Button
        label={
          value.complex ? "Complex task mode enabled" : "Use complex task mode"
        }
        secondary
        disabled={disabled}
        onPress={() => onChange({ ...value, complex: !value.complex })}
      />
      {model?.capabilities?.vision === false && (
        <Copy muted>
          This model does not support image analysis. Document behavior remains
          controlled by OpenJM.
        </Copy>
      )}
    </>
  );
}
