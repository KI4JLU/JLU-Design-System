import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import { Input } from "./input";
import { FormControl, FormItem, FormLabel } from "./form";

describe("Input", () => {
  it("renders a bare input without a wrapper when no leadingIcon is set", () => {
    const { container } = render(<Input aria-label="Name" />);
    expect(container.firstElementChild?.tagName).toBe("INPUT");
  });

  it("renders the leading icon decoratively and pads the field", () => {
    render(<Input type="search" leadingIcon={<Search />} aria-label="Suchen" />);
    const input = screen.getByRole("searchbox", { name: "Suchen" });
    expect(input).toHaveClass("pl-10");
    const icon = input.parentElement?.querySelector("[aria-hidden='true'] svg");
    expect(icon).toBeInTheDocument();
  });

  it("stays wired to FormControl (id/aria go to the input, not the wrapper)", () => {
    render(
      <FormItem error="Pflichtfeld">
        <FormLabel>Suche</FormLabel>
        <FormControl>
          <Input leadingIcon={<Search />} />
        </FormControl>
      </FormItem>,
    );
    const input = screen.getByRole("textbox", { name: "Suche" });
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});
