export const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
export const asText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
export function resourceId(value: unknown) {
  const id = asText(value);
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id))
    throw new Error("The requested resource could not be used.");
  return id;
}
export type AppDefinition = {
  id: string;
  name: string;
  description: string | null;
  capabilities: string[];
  schema: Record<string, unknown>;
};
export function appDefinition(value: unknown): AppDefinition {
  const raw = asRecord(value);
  return {
    id: resourceId(raw.id),
    name: asText(raw.name) ?? "App",
    description: asText(raw.description),
    capabilities: Array.isArray(raw.capabilities)
      ? raw.capabilities.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    schema: asRecord(raw.config_schema ?? raw.configSchema),
  };
}
export type Installation = {
  id: string;
  appId: string | null;
  enabled: boolean | null;
  status: string | null;
  detail: string | null;
  config: Record<string, unknown>;
};
export function installation(value: unknown): Installation {
  const raw = asRecord(value);
  return {
    id: resourceId(raw.id),
    appId: asText(raw.app_id ?? raw.appId),
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : null,
    status: asText(raw.status),
    detail: asText(raw.detail),
    config: asRecord(raw.config),
  };
}
export function collection(value: unknown): unknown[] {
  const raw = asRecord(value);
  const list = Array.isArray(value) ? value : raw.data;
  if (!Array.isArray(list))
    throw new Error("The service list could not be read.");
  return list;
}
export function installationSecret(value: unknown) {
  const raw = asRecord(value),
    secret = asText(raw.installation_token ?? raw.installationToken);
  if (!secret || secret.length > 4096)
    throw new Error(
      "The installation secret could not be displayed. Check the installation before repeating this action.",
    );
  return secret;
}
export function configuration(
  schema: Record<string, unknown>,
  values: Record<string, string>,
  initial: Record<string, unknown> = {},
) {
  const properties = asRecord(schema.properties),
    required = Array.isArray(schema.required) ? schema.required : [];
  const result = { ...initial };
  for (const [key, raw] of Object.entries(properties)) {
    const property = asRecord(raw),
      text = values[key]?.trim() ?? "";
    if (!text) {
      if (property.writeOnly === true && initial[key] !== undefined) continue;
      if (required.includes(key))
        throw new Error(`${asText(property.title) ?? key} is required.`);
      delete result[key];
      continue;
    }
    let value: unknown = text;
    if (
      ["integer", "number", "boolean", "object", "array"].includes(
        String(property.type),
      )
    ) {
      try {
        value = JSON.parse(text);
      } catch {
        throw new Error(`${key} needs a valid ${property.type} value.`);
      }
      const valid =
        property.type === "integer"
          ? typeof value === "number" && Number.isSafeInteger(value)
          : property.type === "number"
            ? typeof value === "number" && Number.isFinite(value)
            : property.type === "boolean"
              ? typeof value === "boolean"
              : property.type === "array"
                ? Array.isArray(value)
                : value !== null &&
                  typeof value === "object" &&
                  !Array.isArray(value);
      if (!valid)
        throw new Error(`${key} needs a valid ${property.type} value.`);
    }
    if (Array.isArray(property.enum) && !property.enum.includes(value))
      throw new Error(`Choose a supported value for ${key}.`);
    if (
      typeof value === "string" &&
      ((typeof property.minLength === "number" &&
        value.length < property.minLength) ||
        (typeof property.maxLength === "number" &&
          value.length > property.maxLength))
    )
      throw new Error(`${key} does not meet the published length limits.`);
    if (
      typeof value === "number" &&
      ((typeof property.minimum === "number" && value < property.minimum) ||
        (typeof property.maximum === "number" && value > property.maximum))
    )
      throw new Error(`${key} does not meet the published limits.`);
    result[key] = value;
  }
  return result;
}
