import { Download } from "lucide-react";

const DownloadIcon = ({ className = "w-6 h-6", ...props }) => (
  <Download className={className} strokeWidth={2} {...props} />
);

export default DownloadIcon;
