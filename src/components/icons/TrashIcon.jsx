import { Trash2 } from "lucide-react";

const TrashIcon = ({ className = "w-6 h-6", ...props }) => (
  <Trash2 className={className} strokeWidth={2} {...props} />
);

export default TrashIcon;
