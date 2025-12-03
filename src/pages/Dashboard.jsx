import { User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { MODAL_PROFILE } from "../App";

const Dashboard = () => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const displayName = user?.displayName || "Utente";

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-bg-secondary border-b border-border sticky top-0 z-50">
        {/* Logo - Left */}
        <span className="text-lg font-bold text-primary">Scaletta</span>

        {/* Profile Button - Right */}
        <button
          onClick={() => openModal(MODAL_PROFILE)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary bg-bg-tertiary rounded-lg hover:bg-divider hover:text-text-primary transition-colors"
          aria-label="Apri profilo"
        >
          <span className="hidden sm:inline">{displayName}</span>
          <User className="w-5 h-5" />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Ciao, {displayName}! 👋
          </h1>
          <p className="text-text-secondary">Pagina in costruzione.</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
