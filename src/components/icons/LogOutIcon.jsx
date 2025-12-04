import { LogOut } from "lucide-react";

const LogOutIcon = ({ className = "w-6 h-6", ...props }) => (
  <LogOut className={className} strokeWidth={2} {...props} />
);

export default LogOutIcon;
