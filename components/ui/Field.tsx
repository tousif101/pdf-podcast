import type { ComponentProps } from "react";

type FieldProps = ComponentProps<"input"> & {
  label: string;
  id: string;
};

export default function Field({ label, id, className = "", ...props }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium text-ink-2"
      >
        {label}
      </label>
      <input
        id={id}
        className={`w-full bg-card border border-line rounded-xl px-4 py-3.5 text-[15px] text-ink placeholder:text-ink-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${className}`}
        {...props}
      />
    </div>
  );
}
