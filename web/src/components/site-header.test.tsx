import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("renders the site name and navigation", () => {
    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );

    expect(screen.getByText("Forum")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "最新" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
