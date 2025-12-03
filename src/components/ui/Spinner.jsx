const Spinner = ({ className = "w-6 h-6" }) => (
  <div
    className={`${className} border-3 border-transparent border-t-current rounded-full animate-spin`}
  />
);

export default Spinner;
