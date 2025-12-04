import { Users } from "lucide-react";

const UsersIcon = ({ className = "w-6 h-6", ...props }) => (
  <Users className={className} strokeWidth={2} {...props} />
);

export default UsersIcon;
