import { Plus } from "lucide-react";

const PlusIcon = ({ className = "w-6 h-6", ...props }) => (
  <Plus className={className} strokeWidth={2} {...props} />
);

export default PlusIcon;
