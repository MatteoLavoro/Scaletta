import { Copy } from "lucide-react";

const CopyIcon = ({ className = "w-6 h-6", ...props }) => (
  <Copy className={className} strokeWidth={2} {...props} />
);

export default CopyIcon;
