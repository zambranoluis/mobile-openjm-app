import { fireEvent, render } from "@testing-library/react-native";
import { describe, it, jest, expect } from "@jest/globals";
import { Button, Feedback, Field } from "../../src/ui/controls";
describe("native form controls", () => {
  it("keeps input visible and editable while feedback is shown", () => {
    const update = jest.fn();
    const view = render(
      <>
        <Field
          label="Email"
          value="reader@example.test"
          onChangeText={update}
        />
        <Feedback message="Check your connection and try again." />
      </>,
    );
    expect(view.getByLabelText("Email").props.value).toBe(
      "reader@example.test",
    );
    fireEvent.changeText(view.getByLabelText("Email"), "second@example.test");
    expect(update).toHaveBeenCalledWith("second@example.test");
    expect(view.getByRole("alert")).toBeTruthy();
  });
  it("prevents duplicate input while busy and announces state", () => {
    const send = jest.fn();
    const view = render(<Button label="Sign in" busy onPress={send} />);
    const button = view.getByRole("button");
    fireEvent.press(button);
    expect(send).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    });
  });
});
