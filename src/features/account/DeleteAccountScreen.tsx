import { useState } from "react";
import { api } from "../../platform/runtime";
import { clearExportFiles } from "../../platform/exports";
import { Copy, Field, Screen, Title } from "../../ui/controls";
import { useAuth } from "../auth/AuthProvider";
import { SensitiveAction } from "./SensitiveAction";
export function DeleteAccountScreen() {
  const [confirmation, setConfirmation] = useState("");
  const { reload, profile } = useAuth();
  async function remove() {
    if (confirmation !== "DELETE")
      throw new Error("Type DELETE to confirm account deletion.");
    await api.request("/v1/me", { method: "DELETE" });
    try {
      await api.session.clear();
      clearExportFiles();
    } finally {
      await reload().catch(() => {});
    }
  }
  return (
    <Screen>
      <Title localize>Delete account</Title>
      <Copy>
        This permanently deletes your OpenJM account and its data. Verify the
        account shown below, type DELETE, then confirm with the server-issued
        verification code.
      </Copy>
      <Copy>{profile?.email}</Copy>
      <Field
        label="Deletion confirmation"
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
      />
      <SensitiveAction
        action="ACCOUNT_DELETE"
        label="Verify account deletion"
        disabled={confirmation !== "DELETE"}
        perform={remove}
      />
    </Screen>
  );
}
