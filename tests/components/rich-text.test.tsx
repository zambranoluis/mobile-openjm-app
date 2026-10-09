import { render, screen } from "@testing-library/react-native";
/* eslint-disable @typescript-eslint/no-require-imports -- Hoisted native WebView mock. */
import { expect, test, jest } from "@jest/globals";
import { RichText } from "../../src/ui/RichText";
test("legal and response text render as native headings, links and selectable code", () => {
  render(
    <RichText>
      {
        "# Readable title\n\n**Strong words** and [help](https://example.test/help).\n\n```ts\nconst saved = true;\n```"
      }
    </RichText>,
  );
  expect(screen.getByRole("header").props.children).toBeTruthy();
  expect(screen.getByRole("link").props.children).toBeTruthy();
  expect(screen.getByText("const saved = true;").props.selectable).toBe(true);
});
jest.mock("react-native-webview", () => ({
  WebView: require("react-native").View,
}));
