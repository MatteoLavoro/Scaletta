import { AlertTriangle } from "lucide-react";

const AlertTriangleIcon = ({ className = "w-6 h-6", ...props }) => (
  <AlertTriangle className={className} strokeWidth={2} {...props} />
);

export default AlertTriangleIcon;
