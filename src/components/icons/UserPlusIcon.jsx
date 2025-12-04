import { UserPlus } from "lucide-react";

const UserPlusIcon = ({ className = "w-6 h-6", ...props }) => (
  <UserPlus className={className} strokeWidth={2} {...props} />
);

export default UserPlusIcon;
