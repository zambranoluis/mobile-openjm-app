import { render, fireEvent } from "@testing-library/react-native";
import { expect, jest, test } from "@jest/globals";
import {
  ModelOptions,
  chatOptions,
} from "../../src/features/conversations/ModelOptions";
test("unsupported model choices never become reasoning or web-search request flags", () => {
  const value = { thinking: true, webSearch: true, complex: false };
  expect(
    chatOptions(
      {
        id: "fictional",
        capabilities: { reasoning: false, web_search: false },
      },
      value,
    ),
  ).toEqual({ complexity_mode: "auto" });
  expect(
    chatOptions(
      { id: "fictional", capabilities: { reasoning: true, web_search: true } },
      value,
    ),
  ).toEqual({
    thinking: true,
    web_search: { enabled: true },
    complexity_mode: "auto",
  });
  const change = jest.fn(),
    screen = render(
      <ModelOptions
        model={{
          id: "fictional",
          capabilities: { reasoning: false, web_search: true },
        }}
        value={value}
        onChange={change}
        disabled={false}
      />,
    );
  expect(screen.queryByLabelText("Use reasoning")).toBeNull();
  fireEvent(
    screen.getByLabelText("Search the web for this response"),
    "valueChange",
    false,
  );
  expect(change).toHaveBeenCalledWith({ ...value, webSearch: false });
});
