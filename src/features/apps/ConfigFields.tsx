import { Switch, View } from "react-native";
import { Button, Copy, Field } from "../../ui/controls";
import { asRecord, asText } from "./appModel";
export function configValues(
  schema: Record<string, unknown>,
  initial: Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(asRecord(schema.properties)).map(([key, raw]) => {
      const property = asRecord(raw),
        value =
          property.writeOnly === true ? "" : (initial[key] ?? property.default);
      return [
        key,
        value === undefined
          ? ""
          : typeof value === "string"
            ? value
            : JSON.stringify(value),
      ];
    }),
  );
}
export function ConfigFields({
  schema,
  values,
  onChange,
  disabled,
}: {
  schema: Record<string, unknown>;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  disabled: boolean;
}) {
  return (
    <>
      {Object.entries(asRecord(schema.properties)).map(([key, raw]) => {
        const property = asRecord(raw),
          label = asText(property.title) ?? key,
          value = values[key] ?? "";
        const change = (next: string) => onChange({ ...values, [key]: next });
        return (
          <View key={key} style={{ gap: 8 }}>
            {property.type === "boolean" ? (
              <>
                <Copy>{label}</Copy>
                <Switch
                  accessibilityLabel={label}
                  value={value === "true"}
                  onValueChange={(next) => change(String(next))}
                  disabled={disabled}
                />
              </>
            ) : Array.isArray(property.enum) ? (
              <>
                <Copy>{label}</Copy>
                {property.enum.map((option, index) => (
                  <Button
                    key={index}
                    label={`${value === String(option) ? "Selected: " : ""}${String(option)}`}
                    secondary
                    disabled={disabled}
                    onPress={() =>
                      change(
                        typeof option === "string"
                          ? option
                          : JSON.stringify(option),
                      )
                    }
                  />
                ))}
              </>
            ) : (
              <Field
                localize={false}
                label={
                  property.type === "object" || property.type === "array"
                    ? `${label} (JSON)`
                    : label
                }
                value={value}
                onChangeText={change}
                editable={!disabled}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={
                  property.writeOnly === true || property.format === "password"
                }
                multiline={
                  property.type === "object" || property.type === "array"
                }
                keyboardType={
                  property.type === "integer" || property.type === "number"
                    ? "numbers-and-punctuation"
                    : "default"
                }
              />
            )}
            {asText(property.description) && (
              <Copy muted>{asText(property.description)}</Copy>
            )}
          </View>
        );
      })}
    </>
  );
}
