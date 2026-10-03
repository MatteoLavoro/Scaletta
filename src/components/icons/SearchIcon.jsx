import { Search } from "lucide-react";

const SearchIcon = ({ className = "w-6 h-6", ...props }) => (
  <Search className={className} strokeWidth={2} {...props} />
);

export default SearchIcon;
