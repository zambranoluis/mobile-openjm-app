/* eslint-disable @typescript-eslint/no-require-imports -- Hoisted Jest factories need runtime imports. */
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { beforeEach, afterEach, expect, jest, test } from "@jest/globals";
import { AppState } from "react-native";
import { api } from "../../src/platform/runtime";
import { useResponseConnection } from "../../src/features/conversations/useResponseConnection";
jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) =>
    require("react").useEffect(callback, [callback]),
}));
jest.mock("../../src/platform/runtime", () => ({
  api: {
    request: require("@jest/globals").jest.fn(),
    stream: require("@jest/globals").jest.fn(),
    resume: require("@jest/globals").jest.fn(),
  },
}));
const conversation = "11111111-1111-4111-8111-111111111111",
  streamId = "33333333-3333-4333-8333-333333333333";
const request = jest.mocked(api.request),
  stream = jest.mocked(api.stream),
  resume = jest.mocked(api.resume);
let listener: (state: "active" | "background") => void = () => {};
beforeEach(() => {
  jest.clearAllMocks();
  AppState.currentState = "active";
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_name, callback) => {
      listener = callback;
      return { remove: () => {} };
    });
  request.mockResolvedValue(undefined);
});
afterEach(() => {
  jest.restoreAllMocks();
});
test("many valid events cannot grow a private partial response without a total bound", async () => {
  const reload = jest.fn(async () => {}),
    completed = jest.fn();
  const { result } = renderHook(() =>
    useResponseConnection(conversation, reload, completed),
  );
  await waitFor(() => expect(reload).toHaveBeenCalled());
  stream.mockImplementation(async (_path, _body, emit) => {
    for (let i = 0; i < 9; i++)
      emit({
        id: `9-${i}`,
        event: "message",
        data: JSON.stringify({
          choices: [{ delta: { content: "x".repeat(262144) } }],
        }),
      });
    return streamId;
  });
  await act(async () => {
    expect(await result.current.send({ client_submission_id: "bounded" })).toBe(
      false,
    );
  });
  expect(result.current.error).toMatch(/device text limit/);
  expect(result.current.partial.length).toBe(2 * 1024 * 1024);
  expect(stream).toHaveBeenCalledTimes(1);
});
test("background/reopen resumes from the last event and never repeats a submitted message", async () => {
  const reload = jest.fn(async () => {}),
    completed = jest.fn();
  const { result } = renderHook(() =>
    useResponseConnection(conversation, reload, completed),
  );
  await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  stream.mockImplementation(async (_path, _body, emit, signal, opened) => {
    opened?.(streamId);
    emit({
      id: "8-1",
      event: "message",
      data: '{"choices":[{"delta":{"content":"first"}}]}',
    });
    await new Promise<void>((_resolve, reject) =>
      signal.addEventListener(
        "abort",
        () => reject(new Error("fixture disconnected")),
        { once: true },
      ),
    );
    return streamId;
  });
  let sending: Promise<boolean> | undefined;
  act(() => {
    sending = result.current.send({
      client_submission_id: "one",
      content: "fictional",
      stream: true,
    });
  });
  await waitFor(() => expect(result.current.partial).toBe("first"));
  AppState.currentState = "background";
  await act(async () => {
    listener("background");
    await sending;
  });
  expect(result.current.partial).toBe("first");
  expect(result.current.busy).toBe(false);
  request.mockResolvedValue({
    streamId,
    conversationId: conversation,
    clientSubmissionId: "one",
    status: "streaming",
  });
  resume.mockImplementation(async (_path, emit, _signal, cursor) => {
    expect(cursor).toBe("8-1");
    emit({
      id: "8-2",
      event: "message",
      data: '{"choices":[{"delta":{"content":" resumed"}}]}',
    });
    emit({ id: "8-3", event: "message", data: "[DONE]" });
    return streamId;
  });
  AppState.currentState = "active";
  await act(async () => {
    listener("active");
  });
  await waitFor(() => expect(completed).toHaveBeenCalledWith("one"));
  expect(stream).toHaveBeenCalledTimes(1);
  expect(resume).toHaveBeenCalledTimes(1);
  expect(result.current.partial).toBe("");
});
test("the explicit close action disconnects the consumer and keeps partial text for recovery", async () => {
  const reload = jest.fn(async () => {}),
    completed = jest.fn();
  const { result } = renderHook(() =>
    useResponseConnection(conversation, reload, completed),
  );
  await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  stream.mockImplementation(async (_path, _body, emit, signal, opened) => {
    opened?.(streamId);
    emit({
      id: "9-1",
      event: "message",
      data: '{"choices":[{"delta":{"content":"retained"}}]}',
    });
    await new Promise<void>((_resolve, reject) =>
      signal.addEventListener("abort", () => reject(new Error("closed")), {
        once: true,
      }),
    );
    return streamId;
  });
  let sending: Promise<boolean> | undefined;
  act(() => {
    sending = result.current.send({
      client_submission_id: "fixture-submission",
    });
  });
  await waitFor(() => expect(result.current.partial).toBe("retained"));
  await act(async () => {
    result.current.close();
    await sending;
  });
  expect(result.current.busy).toBe(false);
  expect(result.current.partial).toBe("retained");
  expect(result.current.error).toMatch(/closed/);
  expect(completed).not.toHaveBeenCalled();
});
