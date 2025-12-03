const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  ...props
}) => {
  const isDisabled = disabled || loading;

  const baseStyles =
    "font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2";

  // Stili per stato disabilitato: grigio, non cliccabile, cursore normale
  const disabledStyles = isDisabled
    ? "bg-divider text-text-muted cursor-default pointer-events-none"
    : "";

  const variants = {
    primary: isDisabled
      ? ""
      : "bg-primary text-black hover:bg-primary-light active:scale-[0.98]",
    secondary: isDisabled
      ? ""
      : "bg-transparent text-primary border-2 border-primary hover:bg-primary/10 active:scale-[0.98]",
    ghost: isDisabled
      ? ""
      : "bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3.5 text-base",
    lg: "px-8 py-4 text-lg",
    icon: "p-2.5",
  };

  return (
    <button
      className={`${baseStyles} ${disabledStyles} ${
        !isDisabled ? variants[variant] : ""
      } ${sizes[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
