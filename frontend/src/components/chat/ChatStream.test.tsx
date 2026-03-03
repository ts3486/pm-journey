import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatStream } from "./ChatStream";
import type { Message } from "@/types";

const makeMessage = (overrides: Partial<Message> & { id: string }): Message => ({
  sessionId: "session-1",
  role: "user",
  content: "Hello",
  createdAt: "2025-01-15T10:00:00Z",
  ...overrides,
});

describe("ChatStream", () => {
  it("shows empty state when no messages", () => {
    render(<ChatStream messages={[]} />);
    expect(screen.getByText("まだメッセージがありません。開始してください。")).toBeInTheDocument();
  });

  it("renders user messages with YOU badge", () => {
    const messages = [makeMessage({ id: "m1", role: "user", content: "Test message" })];
    render(<ChatStream messages={messages} />);
    expect(screen.getByText("YOU")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("renders agent messages with A badge", () => {
    const messages = [makeMessage({ id: "m1", role: "agent", content: "Agent reply" })];
    render(<ChatStream messages={messages} />);
    expect(screen.getAllByText("A")[0]).toBeInTheDocument();
    expect(screen.getByText("Agent reply")).toBeInTheDocument();
  });

  it("renders multiple messages in order", () => {
    const messages = [
      makeMessage({ id: "m1", role: "user", content: "First" }),
      makeMessage({ id: "m2", role: "agent", content: "Second" }),
      makeMessage({ id: "m3", role: "user", content: "Third" }),
    ];
    render(<ChatStream messages={messages} />);
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(3);
  });

  it("shows typing indicator when isTyping is true", () => {
    render(<ChatStream messages={[]} isTyping={true} />);
    expect(screen.getByText("typing…")).toBeInTheDocument();
  });

  it("does not show typing indicator when isTyping is false", () => {
    render(<ChatStream messages={[]} isTyping={false} />);
    expect(screen.queryByText("typing…")).not.toBeInTheDocument();
  });

  it("shows visible tags but hides summary tag", () => {
    const messages = [
      makeMessage({ id: "m1", role: "user", content: "Tagged", tags: ["decision", "summary"] }),
    ];
    render(<ChatStream messages={messages} />);
    expect(screen.getByText("decision")).toBeInTheDocument();
    expect(screen.queryByText("summary")).not.toBeInTheDocument();
  });

  it("does not show tag chip when no visible tags", () => {
    const messages = [
      makeMessage({ id: "m1", role: "user", content: "No tags" }),
    ];
    render(<ChatStream messages={messages} />);
    // There should be no tag chip elements
    const tagChips = document.querySelectorAll(".bg-orange-100\\/80");
    expect(tagChips).toHaveLength(0);
  });
});
