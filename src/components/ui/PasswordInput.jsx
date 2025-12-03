import { forwardRef, useState } from "react";
import EyeIcon from "../icons/EyeIcon";
import EyeOffIcon from "../icons/EyeOffIcon";

const PasswordInput = forwardRef(
  ({ label, error, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={`
            w-full px-4 py-3.5 pr-12 text-base
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
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {error && <span className="text-sm text-error">{error}</span>}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
