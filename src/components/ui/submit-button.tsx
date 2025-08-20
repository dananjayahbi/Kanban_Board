"use client";
import { useFormStatus } from "react-dom";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function SubmitButton({ children, className, disabled, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      aria-disabled={pending}
      disabled={pending || disabled}
      className={cn("data-[pending=true]:opacity-70", className)}
      data-pending={pending}
      {...props}
    >
      {pending ? "Working..." : children}
    </Button>
  );
}
