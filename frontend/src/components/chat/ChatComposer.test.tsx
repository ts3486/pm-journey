import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatComposer } from "@/components/chat/ChatComposer";

describe("ChatComposer", () => {
  it("clears the input immediately after submit while send is pending", async () => {
    let resolveSend: (() => void) | null = null;
    const onSend = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve;
        }),
    );

    render(<ChatComposer onSend={onSend} />);

    const input = screen.getByLabelText("メッセージ入力");
    fireEvent.change(input, { target: { value: "  user message  " } });
    fireEvent.click(screen.getByRole("button", { name: "送信" }));

    expect(onSend).toHaveBeenCalledWith("user message");
    expect(input).toHaveValue("");
    expect(screen.getByRole("button", { name: "送信中…" })).toBeDisabled();

    resolveSend?.();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "送信" })).toBeEnabled();
    });
  });
});
