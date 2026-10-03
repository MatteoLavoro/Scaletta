import { ArrowUpDown } from "lucide-react";

const SortIcon = ({ className = "w-6 h-6", ...props }) => (
  <ArrowUpDown className={className} strokeWidth={2} {...props} />
);

export default SortIcon;
