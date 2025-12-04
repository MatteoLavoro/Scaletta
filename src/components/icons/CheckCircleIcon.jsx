import { CheckCircle } from "lucide-react";

const CheckCircleIcon = ({ className = "w-6 h-6", ...props }) => (
  <CheckCircle className={className} strokeWidth={2} {...props} />
);

export default CheckCircleIcon;
