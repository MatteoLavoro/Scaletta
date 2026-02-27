import { useState, useEffect, useRef } from "react";
import { CloseIcon, SendIcon, ClockIcon, BellOffIcon, TagIcon } from "../icons";
import { TextArea, DateTimePicker } from "../form";
import { BoxTagModal } from "../modal";
import {
  sendNotificationToGroup,
  subscribeToProjectNotifications,
} from "../../services/notifications";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme, getColorForAccent } from "../../contexts/ThemeContext";

/**
 * ChatSidebar - Sidebar chat (stile Telegram)
 * Messaggi più recenti in basso, input in basso con tasti invio e schedule
 *
 * @param {boolean} isOpen - Se la sidebar è aperta
 * @param {function} onClose - Callback chiusura (usata dal FAB esterno)
 * @param {object} project - Dati del progetto
 * @param {object} group - Dati del gruppo
 * @param {Array} bentoBoxes - Lista dei box del progetto per tagging
 * @param {Array} initialTaggedBoxes - Box già taggati all'apertura (opzionale)
 * @param {function} onHighlightBox - Callback per evidenziare un box (passato da ProjectPage)
 * @param {boolean} isMobile - Se è dispositivo mobile (fullscreen)
 * @param {function} isBoxEmpty - Funzione per verificare se un box è vuoto
 * @param {React.RefObject} modifiedBoxesRef - Ref dei box modificati (non eliminabili)
 */
// eslint-disable-next-line no-unused-vars
const ChatSidebar = ({
  isOpen,
  onClose,
  project,
  group,
  bentoBoxes = [],
  initialTaggedBoxes = [],
  onHighlightBox,
  isMobile = false,
  isBoxEmpty,
  modifiedBoxesRef,
}) => {
  const { user } = useAuth();
  const { accentColor, isDark } = useTheme();
  const [message, setMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState(null);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [taggedBoxes, setTaggedBoxes] = useState([]);
  const [isBoxTagModalOpen, setIsBoxTagModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-resize della textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  // Scroll automatico ai messaggi più recenti (smooth)
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Funzione per raggruppare messaggi per data
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;

    messages.forEach((notification) => {
      const timestamp = notification.visibleFrom || notification.createdAt;
      // Controlla se il timestamp esiste prima di usarlo
      if (!timestamp) return;

      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const dateKey = date.toDateString();

      if (dateKey !== currentDate) {
        currentDate = dateKey;
        groups.push({ type: "date", date, key: `date-${dateKey}` });
      }
      groups.push({
        type: "message",
        data: notification,
        key: notification.id,
      });
    });

    return groups;
  };

  // Formatta la data per i separatori
  const formatDateSeparator = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    if (dateStr === todayStr) return "Oggi";
    if (dateStr === yesterdayStr) return "Ieri";

    return new Intl.DateTimeFormat("it-IT", {
      day: "numeric",
      month: "long",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    }).format(date);
  };

  // Helper per ottenere i dati di un box dato il suo ID e titolo salvato
  // Usa il titolo corrente se il box esiste, altrimenti usa il titolo salvato (per box eliminati)
  const getBoxData = (boxId, savedTitle = null) => {
    const box = bentoBoxes.find((b) => b.id === boxId);
    if (!box) {
      // Box eliminato: usa il titolo salvato o un fallback
      return { exists: false, title: savedTitle || "Box eliminato" };
    }
    // Box esistente: usa il titolo corrente (così si aggiorna se viene cambiato)
    return { exists: true, title: box.title, boxType: box.boxType };
  };

  // Sottoscrizione ai messaggi del progetto
  useEffect(() => {
    if (!isOpen || !project?.id || !user?.uid) return;

    setLoadingNotifications(true);
    const unsubscribe = subscribeToProjectNotifications(
      project.id,
      user.uid,
      (projectNotifications) => {
        // Ordina: più vecchi in alto, più recenti in basso
        const sorted = [...projectNotifications].sort((a, b) => {
          const dateA =
            (a.visibleFrom || a.createdAt)?.toDate?.() ||
            new Date(a.visibleFrom || a.createdAt);
          const dateB =
            (b.visibleFrom || b.createdAt)?.toDate?.() ||
            new Date(b.visibleFrom || b.createdAt);
          return dateA - dateB; // Ascendente: vecchi -> recenti
        });
        setNotifications(sorted);
        setLoadingNotifications(false);
        // Scroll ai nuovi messaggi (instant per primo caricamento)
        setTimeout(() => scrollToBottom("auto"), 100);
      },
    );

    return () => unsubscribe();
  }, [isOpen, project?.id, user?.uid]);

  // Scroll immediato PRIMA dell'apertura visiva
  useEffect(() => {
    if (isOpen) {
      scrollToBottom("auto");
    }
  }, [isOpen]);

  // Reset stato quando si apre/chiude
  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setScheduledDate(null);
      setShowSchedulePicker(false);
      setTaggedBoxes(initialTaggedBoxes); // Imposta i box taggati iniziali
      setIsSending(false);
      // Focus sull'input
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, initialTaggedBoxes]);

  // Invia messaggio
  const handleSend = async () => {
    if (!message.trim() || !project || !group || !user || isSending) return;

    setIsSending(true);
    try {
      const memberIds = group.members.map((m) => m.uid);

      await sendNotificationToGroup(
        group.id,
        project.id,
        project.name,
        message,
        {
          uid: user.uid,
          displayName: user.displayName || "Utente",
          accentColor: accentColor, // Passa il colore tema dell'utente corrente
        },
        memberIds,
        scheduledDate,
        taggedBoxes, // Passa i box taggati
      );

      // Reset form
      setMessage("");
      setScheduledDate(null);
      setShowSchedulePicker(false);
      setTaggedBoxes([]);
      textareaRef.current?.focus();

      // Reset altezza textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Errore invio messaggio:", error);
      alert("Errore durante l'invio del messaggio");
    } finally {
      setIsSending(false);
    }
  };

  // Gestione Enter per inviare (Shift+Enter per nuova riga)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Gestione conferma box taggati
  const handleBoxTagConfirm = (selectedBoxes) => {
    setTaggedBoxes(selectedBoxes);
    setIsBoxTagModalOpen(false);
  };

  // Rimuovi un box taggato
  const handleRemoveTaggedBox = (boxId) => {
    setTaggedBoxes((prev) => prev.filter((box) => box.id !== boxId));
  };

  // Formatta timestamp
  const formatTime = (timestamp, isPending = false) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = date - now;

    // Notifica programmata futura
    if (isPending && diffMs > 0) {
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `tra ${diffMins}m`;
      if (diffHours < 24) return `tra ${diffHours}h`;
      if (diffDays < 7) return `tra ${diffDays}g`;

      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${day}/${month} ${hours}:${minutes}`;
    }

    // Messaggi passati
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
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const isDisabled = !message.trim() || isSending;

  // Raggruppa messaggi per data
  const groupedMessages = groupMessagesByDate(notifications);

  return (
    <>
      {/* Sidebar chat - fullscreen mobile, sidebar desktop - parte integrante della pagina */}
      <div
        className={`
          fixed top-0 bottom-0 right-0 bg-bg-secondary border-l border-border shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${isMobile ? "w-full z-50" : "w-[340px] z-40"}
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          ${!isOpen && "pointer-events-none"}
        `}
      >
        {/* Header chat - fisso in alto */}
        <div
          className="shrink-0 bg-bg-secondary border-b border-border px-4 py-3 flex items-center justify-between"
          style={{
            paddingTop: isMobile
              ? "calc(0.75rem + var(--safe-area-inset-top))"
              : "0.75rem",
          }}
        >
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-text-primary truncate">
              {project?.name || "Chat"}
            </h2>
            <p className="text-xs text-text-muted truncate">
              {group?.name || "Progetto"}
            </p>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="ml-3 w-9 h-9 rounded-full bg-bg-tertiary hover:bg-divider text-text-muted hover:text-text-primary transition-colors flex items-center justify-center shrink-0"
              aria-label="Chiudi chat"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Area messaggi - scroll automatico ai più recenti */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {loadingNotifications ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
                <SendIcon className="w-10 h-10 text-text-muted" />
              </div>
              <p className="text-base font-semibold text-text-primary mb-2">
                Nessun messaggio ancora
              </p>
              <p className="text-sm text-text-muted max-w-xs">
                Inizia la conversazione inviando il primo messaggio al team
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {groupedMessages.map((item) => {
                // Separatore di data
                if (item.type === "date") {
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-center my-2"
                    >
                      <div className="bg-bg-tertiary px-3 py-1 rounded-full">
                        <span className="text-xs font-medium text-text-muted">
                          {formatDateSeparator(item.date)}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Messaggio
                const notification = item.data;
                const hasVisibleFrom = !!notification.visibleFrom;
                const visibleDate = hasVisibleFrom
                  ? notification.visibleFrom.toDate
                    ? notification.visibleFrom.toDate()
                    : new Date(notification.visibleFrom)
                  : null;
                const isPending = hasVisibleFrom && visibleDate > new Date();
                const displayTime =
                  notification.visibleFrom || notification.createdAt;
                const isMine = notification.senderId === user?.uid;
                // Ottieni il colore del mittente dal suo tema
                const senderColor = getColorForAccent(
                  notification.senderAccentColor || "teal",
                  isDark ? "dark" : "light",
                );

                return (
                  <div
                    key={item.key}
                    className={`flex ${isMine ? "justify-end" : "justify-start"} animate-fade-in`}
                  >
                    <div
                      className={`
                        max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-md
                        transition-all duration-200 hover:shadow-lg
                        ${
                          isMine
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-bg-tertiary border border-border rounded-bl-sm"
                        }
                      `}
                    >
                      {/* Badge messaggio programmato */}
                      {isPending && (
                        <div className="flex items-center gap-1.5 mb-1 pb-1.5 border-b border-white/20">
                          <ClockIcon
                            className={`w-3.5 h-3.5 ${isMine ? "text-white/80" : "text-primary"}`}
                          />
                          <span
                            className={`text-[10px] font-medium uppercase tracking-wide ${isMine ? "text-white/80" : "text-primary"}`}
                          >
                            Programmato
                          </span>
                        </div>
                      )}

                      {/* Nome mittente (solo se non sono io) */}
                      {!isMine && (
                        <div
                          className="text-xs font-semibold mb-1.5"
                          style={{ color: senderColor }}
                        >
                          {notification.senderName}
                        </div>
                      )}

                      {/* Messaggio */}
                      <p
                        className={`text-[13px] leading-relaxed whitespace-pre-wrap wrap-break-word ${
                          isMine ? "text-white" : "text-text-primary"
                        }`}
                      >
                        {notification.message}
                      </p>

                      {/* Box taggati */}
                      {notification.taggedBoxes &&
                        notification.taggedBoxes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10">
                            {notification.taggedBoxes.map((taggedBox) => {
                              const boxData = getBoxData(
                                taggedBox.id,
                                taggedBox.title,
                              );
                              const isDeleted = !boxData.exists;
                              return (
                                <button
                                  key={taggedBox.id}
                                  onClick={() => {
                                    if (!isDeleted && onHighlightBox) {
                                      onHighlightBox(taggedBox.id);
                                    }
                                  }}
                                  disabled={isDeleted}
                                  className={`
                                  flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium
                                  transition-all duration-150
                                  ${
                                    isMine
                                      ? "bg-white/20 text-white"
                                      : isDark
                                        ? "bg-white text-black"
                                        : "bg-black text-white"
                                  }
                                  ${!isDeleted && "hover:opacity-75 cursor-pointer active:scale-95"}
                                  ${isDeleted && "opacity-60 cursor-default"}
                                `}
                                >
                                  <TagIcon className="w-3 h-3" />
                                  <span
                                    className={isDeleted ? "line-through" : ""}
                                  >
                                    {boxData.title}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                      {/* Timestamp */}
                      <div
                        className={`text-[10px] mt-1.5 text-right flex items-center justify-end gap-1 ${
                          isMine ? "text-white/60" : "text-text-muted"
                        }`}
                      >
                        {formatTime(displayTime, isPending)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input messaggio in basso */}
        <div className="shrink-0 border-t border-border bg-bg-primary px-4 py-3">
          {/* Box taggati */}
          {taggedBoxes.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {taggedBoxes.map((taggedBox) => {
                const boxData = getBoxData(taggedBox.id, taggedBox.title);
                const isDeleted = !boxData.exists;
                return (
                  <div
                    key={taggedBox.id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                      isDeleted
                        ? "bg-red-500/10 border border-red-500/30"
                        : "bg-bg-tertiary border border-border"
                    }`}
                  >
                    <TagIcon
                      className={`w-3 h-3 ${isDeleted ? "text-red-500" : "text-text-primary"}`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isDeleted
                          ? "text-red-500 line-through"
                          : "text-text-primary"
                      }`}
                    >
                      {boxData.title}
                    </span>
                    <button
                      onClick={() => handleRemoveTaggedBox(taggedBox.id)}
                      className={
                        isDeleted
                          ? "text-red-500 hover:text-red-700"
                          : "text-text-secondary hover:text-text-primary"
                      }
                    >
                      <CloseIcon className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* DateTimePicker (mostra solo quando aperto) */}
          {showSchedulePicker && (
            <div className="mb-3">
              <DateTimePicker
                label="Programma invio"
                value={scheduledDate}
                onChange={setScheduledDate}
                minDate={new Date()}
                placeholder="Seleziona data e ora"
              />
              {scheduledDate && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
                  <ClockIcon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-primary font-medium">
                    {formatScheduledDate(scheduledDate)}
                  </span>
                  <button
                    onClick={() => {
                      setScheduledDate(null);
                      setShowSchedulePicker(false);
                    }}
                    className="ml-auto text-primary hover:text-primary-dark"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Area input con tasti */}
          <div className="flex items-end gap-2">
            {/* TextArea */}
            <div className="flex-1 flex items-end">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Scrivi un messaggio..."
                rows={1}
                disabled={isSending}
                className="
                  w-full px-3 py-2.5
                  bg-bg-secondary border border-border rounded-xl
                  text-sm text-text-primary placeholder-text-muted
                  focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40
                  resize-none transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                style={{ minHeight: "42px", maxHeight: "120px" }}
              />
            </div>

            {/* Tasti azione */}
            <div
              className="flex items-end gap-1 pb-px"
              style={{ minHeight: "40px" }}
            >
              {/* Tasto programma */}
              <button
                onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                disabled={isSending}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-colors shrink-0
                  ${
                    showSchedulePicker
                      ? "bg-primary text-white"
                      : "bg-bg-tertiary text-text-muted hover:bg-divider hover:text-primary"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label="Programma invio"
                title="Programma invio"
              >
                <ClockIcon className="w-5 h-5" />
              </button>

              {/* Tasto tagga box */}
              <button
                onClick={() => setIsBoxTagModalOpen(true)}
                disabled={isSending}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-colors shrink-0
                  ${
                    taggedBoxes.length > 0
                      ? "bg-primary text-white"
                      : "bg-bg-tertiary text-text-muted hover:bg-divider hover:text-primary"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label="Tagga box"
                title="Tagga box"
              >
                <TagIcon className="w-5 h-5" />
                {taggedBoxes.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                    {taggedBoxes.length}
                  </span>
                )}
              </button>

              {/* Tasto invio */}
              <button
                onClick={handleSend}
                disabled={isDisabled}
                className="
                  w-10 h-10 rounded-full flex items-center justify-center shrink-0
                  bg-primary text-white
                  hover:bg-primary-dark
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all
                "
                aria-label="Invia messaggio"
                title="Invia (Enter)"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <SendIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal per selezionare i box da taggare */}
      <BoxTagModal
        isOpen={isBoxTagModalOpen}
        boxes={bentoBoxes
          .filter((box) => {
            // Permetti sempre i box pinnati (non vengono eliminati)
            if (box.isPinned) return true;
            // Permetti i box modificati (non vengono eliminati)
            if (modifiedBoxesRef?.current?.has(box.id)) return true;
            // Escludi i box vuoti che verrebbero eliminati
            if (isBoxEmpty && isBoxEmpty(box)) return false;
            // Permetti tutti gli altri
            return true;
          })
          .map((box) => ({
            id: box.id,
            title: box.title,
            boxType: box.boxType,
          }))}
        initialSelectedBoxIds={taggedBoxes.map((box) => box.id)}
        onConfirm={handleBoxTagConfirm}
        onClose={() => setIsBoxTagModalOpen(false)}
      />
    </>
  );
};

export default ChatSidebar;
