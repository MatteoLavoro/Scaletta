import { Printer } from "lucide-react";

const PrinterIcon = ({ className = "w-6 h-6", ...props }) => (
  <Printer className={className} strokeWidth={2} {...props} />
);

export default PrinterIcon;
