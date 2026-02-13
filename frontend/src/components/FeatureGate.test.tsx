import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FeatureGate } from "@/components/FeatureGate";

describe("FeatureGate", () => {
  it("renders children when allowed", () => {
    render(
      <MemoryRouter>
        <FeatureGate allowed title="Hidden" description="Hidden">
          <div>Allowed Content</div>
        </FeatureGate>
      </MemoryRouter>
    );

    expect(screen.getByText("Allowed Content")).toBeInTheDocument();
    expect(screen.queryByText("Plan Gate")).not.toBeInTheDocument();
  });

  it("renders paywall message and CTA when blocked", () => {
    render(
      <MemoryRouter>
        <FeatureGate allowed={false} title="Locked Scenario" description="Upgrade needed" />
      </MemoryRouter>
    );

    expect(screen.getByText("Plan Gate")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Locked Scenario" })).toBeInTheDocument();
    expect(screen.getByText("Upgrade needed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "料金プランを見る" })).toHaveAttribute("href", "/pricing");
  });
});
