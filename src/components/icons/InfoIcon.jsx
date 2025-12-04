import { Info } from "lucide-react";

const InfoIcon = ({ className = "w-6 h-6", ...props }) => (
  <Info className={className} strokeWidth={2} {...props} />
);

export default InfoIcon;
