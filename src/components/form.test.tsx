import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "./input";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "./form";

describe("Form field primitives", () => {
  it("binds label to control and describes it accessibly", () => {
    render(
      <FormItem>
        <FormLabel>E-Mail</FormLabel>
        <FormControl>
          <Input type="email" />
        </FormControl>
        <FormDescription>Wird nicht geteilt.</FormDescription>
      </FormItem>,
    );
    const input = screen.getByLabelText("E-Mail");
    expect(input).toHaveAccessibleDescription("Wird nicht geteilt.");
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("wires error state to aria-invalid and the alert message", () => {
    render(
      <FormItem error="Ungültige E-Mail.">
        <FormLabel>E-Mail</FormLabel>
        <FormControl>
          <Input type="email" />
        </FormControl>
        <FormMessage />
      </FormItem>,
    );
    const input = screen.getByLabelText("E-Mail");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Ungültige E-Mail.");
    expect(input).toHaveAccessibleDescription("Ungültige E-Mail.");
  });
});
