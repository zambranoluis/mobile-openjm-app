import { useState } from "react";
import { View } from "react-native";
import type { Message, ResponseFile } from "../../api/types";
import { Button, Copy } from "../../ui/controls";
import { RichText } from "../../ui/RichText";
import { CopyButton } from "../../ui/CopyButton";
import { responseDetails, structuredResponse } from "./responseDetails";

function Files({ label, files }: { label: string; files: ResponseFile[] }) {
  return files.length ? <View style={{ gap: 8 }}>
    <Copy muted>{label}</Copy>
    {files.map((file, index) => <Copy key={`${file.file_id}-${index}`}>
      {file.filename}{file.content_type ? ` · ${file.content_type}` : ""}{file.bytes !== undefined ? ` · ${file.bytes} bytes` : ""}
    </Copy>)}
  </View> : null;
}
export function ResponseDetails({ message, streaming = false }: { message: Message; streaming?: boolean }) {
  const [thinkingOpen, setThinkingOpen] = useState(false), [sourcesOpen, setSourcesOpen] = useState(false);
  const details = responseDetails(message), reply = structuredResponse(message.content, details.thinking ?? "", streaming);
  return <View style={{ gap: 8 }}>
    {!!reply.thinking && <>
      <Button secondary label={thinkingOpen ? "Hide thinking" : "Thinking"} onPress={() => setThinkingOpen(!thinkingOpen)} />
      {thinkingOpen && <Copy>{reply.thinking}</Copy>}
    </>}
    {!!reply.content && <RichText>{reply.content}</RichText>}
    {!streaming && !!reply.content && <CopyButton value={reply.content} />}
    {!!(details.quotes.length || details.context.length) && <>
      <Button secondary label={sourcesOpen ? "Hide sources" : "Quotes and sources"} onPress={() => setSourcesOpen(!sourcesOpen)} />
      {sourcesOpen && <>
        {details.quotes.map((quote, index) => <View key={index} style={{ gap: 4 }}>
          <Copy muted>{quote.source} · {quote.reference}</Copy><Copy>{quote.excerpt}</Copy>
        </View>)}
        <Files label="Context files" files={details.context} />
      </>}
    </>}
    <Files label="Image attachments" files={details.images} />
    <Files label="Document attachments" files={details.documents} />
    <Files label="Generated files" files={details.generated} />
    {details.processing && <Copy muted>Attachments: {details.processing}</Copy>}
    {details.duration !== null && <Copy muted>Work duration: {details.duration / 1000} seconds</Copy>}
    {details.usage.total !== null && <Copy muted>Total tokens: {details.usage.total}</Copy>}
    {details.incomplete && <Copy muted>Some response details are unavailable.</Copy>}
  </View>;
}
