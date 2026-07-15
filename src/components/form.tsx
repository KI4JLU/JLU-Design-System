import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../lib/utils";
import { Label } from "./label";

/**
 * Lightweight, accessible form field primitives.
 *
 * Deliberately NOT the react-hook-form-based shadcn Form: the app uses simple
 * controlled inputs, so we avoid pulling in RHF + zod. What this DOES guarantee
 * is the accessibility wiring the plan requires — a `<label htmlFor>` bound to
 * the control, plus `aria-invalid` / `aria-describedby` linking the control to
 * its error and description. Pass the current error string to <FormItem error>.
 *
 * If forms grow to need schema validation, swap the internals for RHF + zod
 * without changing call sites.
 */
interface FormFieldContextValue {
  id: string;
  descriptionId: string;
  messageId: string;
  error?: string;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function useFormField() {
  const ctx = React.useContext(FormFieldContext);
  if (!ctx) throw new Error("Form components must be used within <FormItem>");
  return ctx;
}

interface FormItemProps extends React.ComponentProps<"div"> {
  error?: string;
}

function FormItem({ className, error, ...props }: FormItemProps) {
  const id = React.useId();
  const value = React.useMemo<FormFieldContextValue>(
    () => ({
      id,
      descriptionId: `${id}-description`,
      messageId: `${id}-message`,
      error,
    }),
    [id, error],
  );
  return (
    <FormFieldContext.Provider value={value}>
      <div className={cn("flex flex-col gap-1", className)} {...props} />
    </FormFieldContext.Provider>
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Label>) {
  const { id, error } = useFormField();
  return (
    <Label
      htmlFor={id}
      className={cn(error && "text-error", className)}
      {...props}
    />
  );
}

/** Injects id + aria-* onto its single child control (e.g. <Input>). */
function FormControl({ ...props }: React.ComponentPropsWithoutRef<typeof Slot>) {
  const { id, descriptionId, messageId, error } = useFormField();
  return (
    <Slot
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? messageId : descriptionId}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { descriptionId } = useFormField();
  return (
    <p
      id={descriptionId}
      className={cn("text-sm text-on-surface-variant", className)}
      {...props}
    />
  );
}

function FormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
  const { messageId, error } = useFormField();
  const body = error ?? children;
  if (!body) return null;
  return (
    <p
      id={messageId}
      role="alert"
      className={cn("text-sm text-error", className)}
      {...props}
    >
      {body}
    </p>
  );
}

export { FormItem, FormLabel, FormControl, FormDescription, FormMessage };
