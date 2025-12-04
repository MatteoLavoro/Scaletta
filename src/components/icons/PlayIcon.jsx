import { Play } from "lucide-react";

const PlayIcon = ({ className = "w-6 h-6", ...props }) => (
  <Play className={className} strokeWidth={2} {...props} />
);

export default PlayIcon;
