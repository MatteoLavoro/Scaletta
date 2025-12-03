import { forwardRef } from "react";

const Input = forwardRef(({ label, error, className = "", ...props }, ref) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-4 py-3.5 text-base
          bg-bg-tertiary text-text-primary
          border border-divider rounded-lg
          placeholder:text-text-muted
          focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
          transition-all duration-200
          ${error ? "border-error" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-sm text-error">{error}</span>}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
