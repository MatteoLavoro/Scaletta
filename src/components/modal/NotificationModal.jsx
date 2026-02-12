import { useState, useEffect } from "react";
import { Modal } from "../modal";
import { TextArea, DateTimePicker } from "../form";
import { ClockIcon, SendIcon, BellOffIcon } from "../icons";
import {
  sendNotificationToGroup,
  subscribeToProjectNotifications,
} from "../../services/notifications";
import { useAuth } from "../../contexts/AuthContext";
import { useIsMobile } from "../../hooks/useIsMobile";

/**
 * NotificationModal - Modale per inviare e visualizzare notifiche del progetto
 * Layout responsive:
 * - Desktop: 2 colonne (storico sx, form dx)
 * - Mobile: flex column (form sopra, storico sotto)
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {function} onClose - Callback chiusura
 * @param {object} project - Dati del progetto
 * @param {object} group - Dati del gruppo
 */
const NotificationModal = ({ isOpen, onClose, project, group }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [message, setMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const maxLength = 200;

  // Sottoscrizione alle notifiche del progetto
  useEffect(() => {
    if (!isOpen || !project?.id || !user?.uid) return;

    setLoadingNotifications(true);
    const unsubscribe = subscribeToProjectNotifications(
      project.id,
      user.uid,
      (projectNotifications) => {
        setNotifications(projectNotifications);
        setLoadingNotifications(false);
      },
    );

    return () => unsubscribe();
  }, [isOpen, project?.id, user?.uid]);

  // Reset stato quando si apre/chiude il modale
  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setScheduledDate(null);
      setIsSending(false);
    }
  }, [isOpen]);

  // Invia notifica (immediata o programmata) in background
  const handleSend = async () => {
    if (!message.trim() || !project || !group || !user) return;

    setIsSending(true);
    try {
      const memberIds = group.members.map((m) => m.uid);

      // Salva la notifica (immediata o programmata)
      await sendNotificationToGroup(
        group.id,
        project.id,
        project.name,
        message,
        {
          uid: user.uid,
          displayName: user.displayName || "Utente",
        },
        memberIds,
        scheduledDate, // null = immediata, Date = programmata
      );

      // Chiudi il modale (come gli altri modali)
      if (onClose) {
        onClose();
      } else {
        window.history.back();
      }
    } catch (error) {
      console.error("Errore invio notifica:", error);
      alert("Errore durante l'invio della notifica");
      setIsSending(false);
    }
  };

  // Formatta timestamp (passato o futuro)
  const formatTime = (timestamp, isPending = false) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = date - now; // Futuro se positivo, passato se negativo

    // Se è una notifica programmata futura
    if (isPending && diffMs > 0) {
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `tra ${diffMins}m`;
      if (diffHours < 24) return `tra ${diffHours}h`;
      if (diffDays < 7) return `tra ${diffDays}g`;

      // Altrimenti data completa
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${day}/${month} ${hours}:${minutes}`;
    }

    // Notifiche passate (già inviate)
    const diffMsPast = now - date;
    const diffMinsPast = Math.floor(diffMsPast / 60000);
    const diffHoursPast = Math.floor(diffMsPast / 3600000);
    const diffDaysPast = Math.floor(diffMsPast / 86400000);

    if (diffMinsPast < 1) return "Ora";
    if (diffMinsPast < 60) return `${diffMinsPast}m fa`;
    if (diffHoursPast < 24) return `${diffHoursPast}h fa`;
    if (diffDaysPast < 7) return `${diffDaysPast}g fa`;

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Formatta data programmata
  const formatScheduledDate = (date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const isDisabled = !message.trim() || isSending;

  // Handler onChange stabile per evitare ricreazioni
  const handleMessageChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  // JSX del form (renderizzato direttamente per evitare ricreazioni)
  const formContent = (
    <div className="flex flex-col gap-4">
      <TextArea
        label="Messaggio"
        value={message}
        onChange={handleMessageChange}
        placeholder="Scrivi il messaggio della notifica..."
        rows={4}
        resize={false}
        maxLength={maxLength}
      />
      <div className="text-xs text-text-muted text-right -mt-2">
        {message.length}/{maxLength}
      </div>

      <DateTimePicker
        label="Programma invio (opzionale)"
        value={scheduledDate}
        onChange={setScheduledDate}
        minDate={new Date()}
        placeholder="Invia subito"
      />

      {scheduledDate && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
          <ClockIcon className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">
            Programmata per: {formatScheduledDate(scheduledDate)}
          </span>
        </div>
      )}
    </div>
  );

  // JSX dello storico (renderizzato direttamente per evitare ricreazioni)
  const historyContent = (
    <div className="flex flex-col h-full min-h-0">
      <h3 className="text-base font-semibold text-text-primary mb-3 shrink-0">
        Storico notifiche
      </h3>

      {loadingNotifications ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BellOffIcon className="w-12 h-12 text-text-muted mb-2" />
          <p className="text-sm text-text-muted">Nessuna notifica inviata</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pr-2">
          {notifications.map((notification) => {
            // Determina se è una notifica programmata futura
            const hasVisibleFrom = !!notification.visibleFrom;
            const visibleDate = hasVisibleFrom
              ? notification.visibleFrom.toDate
                ? notification.visibleFrom.toDate()
                : new Date(notification.visibleFrom)
              : null;
            const isPending = hasVisibleFrom && visibleDate > new Date();

            // Il timestamp da mostrare: visibleFrom se presente, altrimenti createdAt
            const displayTime =
              notification.visibleFrom || notification.createdAt;

            return (
              <div
                key={notification.id}
                className="p-3 rounded-lg border transition-colors bg-bg-tertiary border-border hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-primary">
                    {notification.senderName}
                  </span>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {formatTime(displayTime, isPending)}
                  </span>
                </div>
                <p className="text-sm text-text-primary wrap-break-word leading-relaxed">
                  {notification.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      title="Notifiche Progetto"
      confirmText={scheduledDate ? "Programma" : "Invia Ora"}
      onConfirm={handleSend}
      onClose={onClose}
      confirmDisabled={isDisabled}
      isLoading={isSending}
      maxWidth="max-w-4xl"
    >
      {/* Layout responsive: 2 colonne desktop, stack mobile */}
      <div
        className={`
          ${
            isMobile
              ? "flex flex-col gap-5"
              : "grid grid-cols-2 gap-6 h-[450px]"
          }
        `}
      >
        {/* Mobile: Form sopra */}
        {isMobile && formContent}

        {/* Desktop: Storico sinistra / Mobile: Storico sotto */}
        <div
          className={
            isMobile ? "border-t border-divider pt-5" : "flex flex-col min-h-0"
          }
        >
          {historyContent}
        </div>

        {/* Desktop: Form destra */}
        {!isMobile && <div className="flex flex-col">{formContent}</div>}
      </div>
    </Modal>
  );
};

export default NotificationModal;
