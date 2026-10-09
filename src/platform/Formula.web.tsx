import { Copy } from "../ui/controls";
export function Formula({ source }: { source: string; displayMode?: boolean }) {
  return <Copy>{source}</Copy>;
}
