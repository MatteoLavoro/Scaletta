import { ChevronDown } from "lucide-react";

const ChevronDownIcon = ({ className = "w-6 h-6", ...props }) => (
  <ChevronDown className={className} strokeWidth={2} {...props} />
);

export default ChevronDownIcon;
