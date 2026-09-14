import { AxiosError, AxiosHeaders } from "axios";
import { extractErrorMessage } from "../error";
import { fr } from "@trs/shared/i18n";

jest.mock("../i18n", () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

/** An axios failure with, or without, something coming back. */
function axiosError(response?: { status: number; data: unknown }, message = "Network Error") {
  const error = new AxiosError(message);
  if (response) {
    error.response = {
      ...response,
      statusText: "",
      headers: {},
      config: { headers: new AxiosHeaders() },
    } as never;
  }
  return error;
}

describe("extractErrorMessage", () => {
  it("tells the photographer to check their connection when nothing came back", () => {
    // Every shape axios gives a request that never landed
    expect(extractErrorMessage(axiosError(), "fallback")).toBe("common.networkError");
    expect(extractErrorMessage(axiosError(undefined, "timeout of 0ms exceeded"), "x")).toBe(
      "common.networkError",
    );
    expect(extractErrorMessage(axiosError(undefined, "Load failed"), "x")).toBe("common.networkError");
  });

  it("and the copy itself says exactly that", () => {
    expect(fr.common.networkError).toBe("Vérifiez votre connexion internet");
  });

  it("passes on what the server actually refused", () => {
    const refused = axiosError({ status: 404, data: { error: "Spot not found" } });
    expect(extractErrorMessage(refused, "fallback")).toBe("Spot not found");
  });

  it("reads field errors out of a validation refusal", () => {
    const invalid = axiosError({
      status: 400,
      data: { details: { fieldErrors: { title: ["Too short"] } } },
    });
    expect(extractErrorMessage(invalid, "fallback")).toBe("title: Too short");
  });

  it("falls back when there is nothing to read", () => {
    expect(extractErrorMessage({}, "fallback")).toBe("fallback");
  });
});
