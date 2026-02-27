import { MessageSquareIcon } from "../icons";
import { ChevronLeftIcon } from "../icons";

/**
 * ChatFab - Floating Action Button per aprire/chiudere la chat
 * Posizionato a metà altezza verticale dello schermo
 * Si sposta a sinistra quando chat aperta, a destra quando chiusa
 *
 * @param {function} onClick - Callback click
 * @param {number} unreadCount - Numero messaggi non letti
 * @param {boolean} isMobile - Se è dispositivo mobile
 * @param {boolean} isOpen - Se la chat è aperta (mostra chevron left)
 */
const ChatFab = ({
  onClick,
  unreadCount = 0,
  isMobile = false,
  isOpen = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed z-50
        w-14 h-14 rounded-full
        bg-primary text-white
        shadow-lg hover:shadow-xl
        hover:scale-110
        transition-all duration-300 ease-in-out
        flex items-center justify-center
        ${isMobile ? "top-1/2 -translate-y-1/2" : "top-1/2 -translate-y-1/2"}
        ${isOpen ? (isMobile ? "right-4" : "right-[356px]") : "right-6"}
        ${isOpen ? "scale-95 opacity-90" : "scale-100 opacity-100"}
      `}
      aria-label={isOpen ? "Chiudi chat" : "Apri chat progetto"}
    >
      {/* Doppio layout: Icona chat + chevron */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Icona chat principale */}
        <MessageSquareIcon className="w-6 h-6" />

        {/* Chevron che indica direzione: sinistra quando chiusa, destra quando aperta */}
        <div
          className={`absolute -right-1 -bottom-1 w-5 h-5 bg-primary-dark rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
        >
          <ChevronLeftIcon className="w-3 h-3" />
        </div>
      </div>

      {/* Badge rosso messaggi non letti - solo quando chiusa */}
      {!isOpen && unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </div>
      )}
    </button>
  );
};

export default ChatFab;
