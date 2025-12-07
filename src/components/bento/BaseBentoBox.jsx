import { useState } from "react";
import { PencilIcon, TrashIcon } from "../icons";
import { DropdownMenu, Divider } from "../ui";
import { InputModal, ConfirmModal } from "../modal";

/**
 * BaseBentoBox - Componente base per tutti i Bento Box
 *
 * Struttura standard:
 * ┌────────────────────────────────────┐
 * │  Titolo (centrato)           [⋮]  │  ← Header con titolo e kebab menu
 * ├────────────────────────────────────┤  ← Divider
 * │                                    │
 * │         Contenuto                  │  ← Area contenuto (children)
 * │                                    │
 * ├────────────────────────────────────┤
 * │  [ Azione 1 ]  [ Azione 2 ]        │  ← Azioni rapide (opzionali)
 * └────────────────────────────────────┘
 *
 * @param {Object} props
 * @param {string} props.title - Titolo del box
 * @param {function} props.onTitleChange - Callback quando il titolo cambia
 * @param {function} props.onDelete - Callback per eliminare il box
 * @param {number} props.minHeight - Altezza minima del box in pixel (opzionale)
 * @param {ReactNode} props.children - Contenuto del box
 * @param {Array} props.menuItems - Voci aggiuntive per il kebab menu
 * @param {Array} props.actions - Array di azioni rapide { label, icon, onClick, variant }
 * @param {string} props.className - Classi CSS aggiuntive
 */
const BaseBentoBox = ({
  title = "Box",
  onTitleChange,
  onDelete,
  minHeight,
  children,
  menuItems = [],
  actions = [],
  className = "",
}) => {
  const [isEditTitleOpen, setIsEditTitleOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Costruisci il menu kebab
  // Ordine: items specifici -> separatore -> universali (cambia titolo, elimina)
  const buildMenuItems = () => {
    const items = [];

    // Prima aggiungi items specifici del box (passati come props)
    if (menuItems.length > 0) {
      items.push(...menuItems);
    }

    // Costruisci items universali (sempre in fondo)
    const universalItems = [];

    // Opzione modifica titolo
    if (onTitleChange) {
      universalItems.push({
        label: "Cambia titolo",
        icon: <PencilIcon className="w-5 h-5" />,
        onClick: () => setIsEditTitleOpen(true),
      });
    }

    // Opzione elimina (sempre per ultima)
    if (onDelete) {
      universalItems.push({
        label: "Elimina box",
        icon: <TrashIcon className="w-5 h-5" />,
        onClick: () => setIsDeleteConfirmOpen(true),
        danger: true,
      });
    }

    // Aggiungi separatore tra specifici e universali se entrambi presenti
    if (items.length > 0 && universalItems.length > 0) {
      items.push({ separator: true });
    }

    // Aggiungi items universali
    items.push(...universalItems);

    return items;
  };

  const allMenuItems = buildMenuItems();

  // Validazione titolo
  const validateTitle = (value) => {
    const trimmed = value.trim();
    if (trimmed.length < 1) return "Il titolo non può essere vuoto";
    if (trimmed.length > 50) return "Il titolo non può superare 50 caratteri";
    return null;
  };

  // Gestione cambio titolo
  const handleTitleConfirm = async (newTitle) => {
    if (onTitleChange) {
      await onTitleChange(newTitle.trim());
    }
    setIsEditTitleOpen(false);
  };

  return (
    <>
      <div
        className={`
          bg-bg-secondary 
          border border-border 
          rounded-xl
          flex flex-col
          ${className}
        `}
        style={minHeight ? { minHeight: `${minHeight}px` } : undefined}
      >
        {/* Header - Titolo centrato con kebab menu a destra */}
        <div className="flex items-center justify-between px-2 py-1.5">
          {/* Spacer sinistro per centrare il titolo */}
          <div className="w-7" />

          {/* Titolo centrato */}
          <h3 className="text-xs font-semibold text-text-primary truncate flex-1 text-center">
            {title}
          </h3>

          {/* Kebab menu in cerchietto */}
          {allMenuItems.length > 0 ? (
            <div className="w-7 h-7 flex items-center justify-center rounded-full bg-bg-tertiary hover:bg-divider transition-colors">
              <DropdownMenu
                items={allMenuItems}
                ariaLabel={`Menu ${title}`}
                compact
              />
            </div>
          ) : (
            <div className="w-7" />
          )}
        </div>

        {/* Divider sotto il titolo */}
        <Divider spacing="sm" className="my-0! mx-2!" />

        {/* Area contenuto */}
        <div className="p-3">{children}</div>

        {/* Azioni rapide (se presenti) */}
        {actions.length > 0 && (
          <>
            <Divider spacing="sm" className="my-0! mx-3!" />
            <div className="flex items-center gap-2 px-3 py-2">
              {actions.map((action, index) => (
                <BentoAction
                  key={index}
                  label={action.label}
                  icon={action.icon}
                  onClick={action.onClick}
                  variant={action.variant}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modale modifica titolo */}
      <InputModal
        isOpen={isEditTitleOpen}
        title="Cambia titolo"
        label="Nuovo titolo"
        placeholder="Inserisci il titolo"
        initialValue={title}
        confirmText="Salva"
        onConfirm={handleTitleConfirm}
        onClose={() => setIsEditTitleOpen(false)}
        validate={validateTitle}
        minLength={1}
        maxLength={50}
        zIndex={1020}
      />

      {/* Modale conferma eliminazione */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Elimina box"
        message={`Sei sicuro di voler eliminare "${title}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        confirmVariant="danger"
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDelete?.();
        }}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        isDanger
        zIndex={1020}
      />
    </>
  );
};

/**
 * BentoAction - Tasto azione rapida per i Bento Box
 *
 * @param {string} label - Testo del tasto
 * @param {ReactNode} icon - Icona (opzionale)
 * @param {function} onClick - Handler click
 * @param {string} variant - Variante: "default" | "primary" | "danger"
 */
const BentoAction = ({ label, icon, onClick, variant = "default" }) => {
  const variantClasses = {
    default: "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
    primary: "text-primary hover:bg-primary/10",
    danger: "text-red-500 hover:bg-red-500/10",
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 
        px-2.5 py-1.5 
        text-xs font-medium 
        rounded-lg
        transition-colors duration-150
        ${variantClasses[variant] || variantClasses.default}
      `}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label}
    </button>
  );
};

export { BentoAction };
export default BaseBentoBox;
