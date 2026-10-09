import { useState } from "react";
import { languages, languageNames } from "../../ui/languageModel";
import { selectLanguage, useLanguage } from "../../platform/language";
import { Button, Copy, Feedback, Screen, Title } from "../../ui/controls";
export function LanguageScreen() {
  const { language, t } = useLanguage(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  return (
    <Screen>
      <Title localize>Interface language</Title>
      <Feedback message={error} />
      {languages.map((value) => (
        <Button
          key={value}
          label={`${language === value ? "✓ " : ""}${languageNames[value]}`}
          secondary
          busy={busy}
          onPress={() => {
            setBusy(true);
            setError(null);
            void selectLanguage(value)
              .catch(() => setError(t("Language could not be saved.")))
              .finally(() => setBusy(false));
          }}
        />
      ))}
      <Copy>
        {t("Some settings use English while translations are reviewed.")}
      </Copy>
      <Copy>
        {t("Your conversations and server data keep their original language.")}
      </Copy>
    </Screen>
  );
}
