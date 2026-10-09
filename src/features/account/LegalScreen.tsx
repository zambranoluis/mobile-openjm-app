import { useState } from "react";
import { Row, Screen, Title, Button } from "../../ui/controls";
import { RichText } from "../../ui/RichText";
import { legalDocuments } from "./legalDocuments";
export function LegalScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <Screen>
      {!selected && <Title localize>Legal documents</Title>}
      {selected ? (
        <>
          <Button
            label="All legal documents"
            secondary
            onPress={() => setSelected(null)}
          />
          <RichText>{legalDocuments[selected]}</RichText>
        </>
      ) : (
        Object.keys(legalDocuments).map((name) => (
          <Row key={name} title={name} onPress={() => setSelected(name)} />
        ))
      )}
    </Screen>
  );
}
