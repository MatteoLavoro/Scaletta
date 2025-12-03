const SIZE_MAP = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-10 h-10",
};

const Spinner = ({ size = "md", className = "" }) => {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`${sizeClass} border-3 border-transparent border-t-current rounded-full animate-spin text-primary ${className}`}
    />
  );
};

export default Spinner;
