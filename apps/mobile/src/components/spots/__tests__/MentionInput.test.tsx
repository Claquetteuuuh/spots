import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { MentionInput } from "../MentionInput";
import * as api from "../../../lib/api";

jest.mock("react-i18next", () => {
  const t = (key: string) => key;
  return { useTranslation: () => ({ t }), initReactI18next: { type: "3rdParty", init: jest.fn() } };
});

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

jest.mock("../../../lib/api", () => ({ searchUsers: jest.fn(async () => []) }));

const mockedApi = api as jest.Mocked<typeof api>;

const ALICE = { id: "u1", username: "alice", name: "Alice", avatarUrl: null };

/** Names are asked for after a pause; a loaded machine takes its time. */
const READY = { timeout: 5000 };

function Field({ onChangeText }: { onChangeText: (v: string) => void }) {
  const [value, setValue] = React.useState("");
  return (
    <MentionInput
      value={value}
      onChangeText={(next) => {
        setValue(next);
        onChangeText(next);
      }}
      testID="caption"
    />
  );
}

describe("MentionInput", () => {
  beforeEach(() => jest.clearAllMocks());

  it("offers accounts once a name is being typed after an @", async () => {
    mockedApi.searchUsers.mockResolvedValue([ALICE as never]);
    const onChangeText = jest.fn();
    await render(<Field onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByTestId("caption"), "shot with @al");

    expect(await screen.findByTestId("mention-alice", {}, READY)).toBeTruthy();
    await waitFor(
      () => expect(mockedApi.searchUsers).toHaveBeenCalledWith("al", expect.any(Number)),
      READY,
    );
  });

  it("writes the chosen name in place of what was typed", async () => {
    mockedApi.searchUsers.mockResolvedValue([ALICE as never]);
    const onChangeText = jest.fn();
    await render(<Field onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByTestId("caption"), "shot with @al");
    await fireEvent.press(await screen.findByTestId("mention-alice", {}, READY));

    expect(onChangeText).toHaveBeenLastCalledWith("shot with @alice ");
    // …and the list closes once someone is chosen
    expect(screen.queryByTestId("mention-suggestions")).toBeNull();
  });

  it("asks for nobody when no one is being named", async () => {
    await render(<Field onChangeText={jest.fn()} />);

    await fireEvent.changeText(screen.getByTestId("caption"), "just a caption");

    await waitFor(() => expect(screen.queryByTestId("mention-suggestions")).toBeNull(), READY);
    expect(mockedApi.searchUsers).not.toHaveBeenCalled();
  });
});
