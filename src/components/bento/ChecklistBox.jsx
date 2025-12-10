import { useState, useEffect } from "react";
import {
  PlusIcon,
  TrashIcon,
  ListChecksIcon,
  CheckIcon,
  PencilIcon,
} from "../icons";
import BaseBentoBox from "./BaseBentoBox";
import { InputModal, ConfirmModal } from "../modal";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * ChecklistItemRow - Singola riga per un item della checklist
 * Struttura simile a FileRow: checkbox, testo, tasto modifica, tasto elimina
 */
const ChecklistItemRow = ({
  item,
  onToggle,
  onEdit,
  onDelete,
  primaryColor,
}) => {
  return (
    <div className="flex items-center gap-3 bg-bg-tertiary/50 border border-border/50 rounded-lg p-3">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        className={`
          w-10 h-10 rounded-lg flex items-center justify-center shrink-0
          transition-all duration-200
          ${
            item.completed
              ? "border-transparent"
              : "bg-bg-secondary border-2 border-border hover:border-primary"
          }
        `}
        style={{
          backgroundColor: item.completed ? primaryColor : undefined,
        }}
        aria-label={
          item.completed ? "Segna come non completato" : "Segna come completato"
        }
      >
        {item.completed && <CheckIcon className="w-5 h-5 text-white" />}
      </button>

      {/* Testo item */}
      <div className="flex-1 min-w-0">
        <p
          className={`
            text-sm font-medium
            ${
              item.completed
                ? "line-through text-text-muted"
                : "text-text-primary"
            }
          `}
        >
          {item.text || "Elemento senza testo"}
        </p>
      </div>

      {/* Tasti azione */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Modifica */}
        <button
          onClick={() => onEdit(item)}
          className="p-2 rounded-lg transition-colors hover:opacity-80"
          style={{
            backgroundColor: `${primaryColor}20`,
            color: primaryColor,
          }}
          aria-label="Modifica elemento"
          title="Modifica"
        >
          <PencilIcon className="w-4 h-4" />
        </button>

        {/* Elimina */}
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          aria-label="Elimina elemento"
          title="Elimina"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * ChecklistBox - Bento Box per le checklist
 *
 * Box specializzato per liste di cose da fare con checkbox.
 * Permette di aggiungere, spuntare, modificare ed eliminare elementi.
 *
 * @param {string} title - Titolo del box
 * @param {array} items - Array di items { id, text, completed }
 * @param {boolean} isPinned - Se il box è fissato in alto
 * @param {function} onPinToggle - Callback quando si clicca sul pin
 * @param {function} onTitleChange - Callback per cambiare il titolo
 * @param {function} onItemsChange - Callback quando cambiano gli items
 * @param {function} onDelete - Callback per eliminare il box
 * @param {function} onModalStateChange - Callback quando il modal di inserimento si apre/chiude
 */
const ChecklistBox = ({
  title = "Checklist",
  items = [],
  isPinned = false,
  onPinToggle,
  onTitleChange,
  onItemsChange,
  onDelete,
  onModalStateChange,
}) => {
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = nuovo, object = modifica
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null); // ID dell'item da eliminare

  const { colors, accentColor, isDark } = useTheme();

  // Notifica il parent quando il modal si apre/chiude
  useEffect(() => {
    onModalStateChange?.(isInputModalOpen);
  }, [isInputModalOpen, onModalStateChange]);

  // Ottieni il colore primario del tema
  const themeColors =
    colors[accentColor]?.[isDark ? "dark" : "light"] ||
    colors.teal[isDark ? "dark" : "light"];
  const primaryColor = themeColors.primary;

  // Menu aggiuntivo per il box checklist
  const checklistMenuItems = [
    {
      label: "Aggiungi elemento",
      icon: <PlusIcon className="w-5 h-5" />,
      onClick: () => handleStartAddItem(),
    },
  ];

  // Avvia l'aggiunta di un nuovo elemento (apre il modal)
  const handleStartAddItem = () => {
    setEditingItem(null); // null indica nuovo elemento
    setIsInputModalOpen(true);
  };

  // Avvia la modifica di un elemento esistente
  const handleStartEditItem = (item) => {
    setEditingItem(item);
    setIsInputModalOpen(true);
  };

  // Conferma aggiunta/modifica elemento
  const handleConfirmItem = (text) => {
    if (editingItem) {
      // Modifica elemento esistente
      const newItems = items.map((item) =>
        item.id === editingItem.id ? { ...item, text: text.trim() } : item
      );
      onItemsChange?.(newItems);
    } else {
      // Nuovo elemento
      const newItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: text.trim(),
        completed: false,
      };
      onItemsChange?.([...items, newItem]);
    }
    setIsInputModalOpen(false);
    setEditingItem(null);
  };

  // Chiudi modal senza salvare
  const handleCancelItem = () => {
    setIsInputModalOpen(false);
    setEditingItem(null);
  };

  // Toggle completamento di un elemento
  const handleToggleItem = (itemId) => {
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onItemsChange?.(newItems);
  };

  // Avvia eliminazione elemento (apre il modal di conferma)
  const handleStartDeleteItem = (itemId) => {
    setDeletingItemId(itemId);
    setIsDeleteModalOpen(true);
  };

  // Conferma eliminazione elemento
  const handleConfirmDeleteItem = () => {
    if (deletingItemId) {
      const newItems = items.filter((item) => item.id !== deletingItemId);
      onItemsChange?.(newItems);
    }
    setIsDeleteModalOpen(false);
    setDeletingItemId(null);
  };

  // Annulla eliminazione elemento
  const handleCancelDeleteItem = () => {
    setIsDeleteModalOpen(false);
    setDeletingItemId(null);
  };

  const hasItems = items.length > 0;

  // Calcola statistiche
  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  // Validazione input
  const validateItemText = (value) => {
    const trimmed = value.trim();
    if (trimmed.length < 1) return "Il testo non può essere vuoto";
    if (trimmed.length > 200) return "Il testo non può superare 200 caratteri";
    return null;
  };

  return (
    <>
      <BaseBentoBox
        title={hasItems ? `${title} (${completedCount}/${totalCount})` : title}
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onTitleChange={onTitleChange}
        onDelete={onDelete}
        menuItems={checklistMenuItems}
        minHeight={hasItems ? undefined : 150}
      >
        {hasItems ? (
          // Lista elementi checklist
          <div className="space-y-2">
            {items.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onToggle={handleToggleItem}
                onEdit={handleStartEditItem}
                onDelete={handleStartDeleteItem}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        ) : (
          // Stato vuoto
          <button
            onClick={handleStartAddItem}
            className="
              w-full py-6
              flex flex-col items-center justify-center gap-3
              text-text-muted
              hover:text-primary
              transition-colors duration-200
              group
            "
          >
            <div className="w-14 h-14 rounded-full bg-bg-tertiary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <ListChecksIcon className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Aggiungi elemento</p>
              <p className="text-xs text-text-muted/70 mt-0.5">
                Tocca per creare una lista
              </p>
            </div>
          </button>
        )}
      </BaseBentoBox>

      {/* Modal per aggiungere/modificare elemento */}
      <InputModal
        isOpen={isInputModalOpen}
        title={editingItem ? "Modifica elemento" : "Nuovo elemento"}
        label="Testo"
        placeholder="Es: Comprare il latte..."
        initialValue={editingItem?.text || ""}
        confirmText={editingItem ? "Salva" : "Aggiungi"}
        validate={validateItemText}
        onConfirm={handleConfirmItem}
        onClose={handleCancelItem}
        zIndex={1020}
      />

      {/* Modal di conferma eliminazione */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Elimina elemento"
        message="Sei sicuro di voler eliminare questo elemento dalla checklist?"
        confirmText="Elimina"
        cancelText="Annulla"
        onConfirm={handleConfirmDeleteItem}
        onCancel={handleCancelDeleteItem}
        isDanger={true}
        zIndex={1020}
      />
    </>
  );
};

export default ChecklistBox;
