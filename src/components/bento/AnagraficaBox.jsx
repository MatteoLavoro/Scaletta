import { useState } from "react";
import {
  PlusIcon,
  TrashIcon,
  UserIcon,
  PencilIcon,
  CopyIcon,
  CheckIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  PercentIcon,
  FileTypeIcon,
} from "../icons";
import BaseBentoBox from "./BaseBentoBox";
import { InputModal, ConfirmModal } from "../modal";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Mappa delle icone per i campi predefiniti
 */
const FIELD_ICONS = {
  cliente: UserIcon,
  luogo: MapPinIcon,
  iva: PercentIcon,
  email: MailIcon,
  telefono: PhoneIcon,
};

/**
 * Campi predefiniti per l'anagrafica
 */
const PREDEFINED_FIELDS = [
  { key: "cliente", label: "Cliente" },
  { key: "luogo", label: "Luogo" },
  { key: "iva", label: "% IVA" },
  { key: "email", label: "Email" },
  { key: "telefono", label: "Telefono" },
];

/**
 * Renderizza l'icona per un campo
 */
const renderFieldIcon = (fieldKey) => {
  const Icon = FIELD_ICONS[fieldKey];
  if (Icon) {
    return <Icon className="w-5 h-5" />;
  }
  return <FileTypeIcon className="w-5 h-5" />;
};

/**
 * AnagraficaFieldRow - Singola riga per un campo dell'anagrafica
 */
const AnagraficaFieldRow = ({
  field,
  onEdit,
  onDelete,
  onClear,
  onCopy,
  primaryColor,
  isCustom = false,
  copiedFieldKey,
}) => {
  const hasValue = field.value && field.value.trim().length > 0;
  const isCopied = copiedFieldKey === field.key;

  return (
    <div className="flex items-center gap-3 bg-bg-tertiary/50 border border-border/50 rounded-lg p-3">
      {/* Icona campo */}
      <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center text-text-muted shrink-0">
        {renderFieldIcon(field.key)}
      </div>

      {/* Label del campo */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {field.label}
        </p>
        <p className="text-sm font-medium text-text-primary truncate mt-0.5">
          {hasValue ? field.value : "—"}
        </p>
      </div>

      {/* Tasti azione */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Copia */}
        <button
          onClick={() => onCopy(field)}
          className={`p-2 rounded-lg transition-colors ${
            isCopied
              ? "bg-green-500/20 text-green-500"
              : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
          }`}
          aria-label={`Copia ${field.label}`}
          title={isCopied ? "Copiato!" : "Copia"}
        >
          {isCopied ? (
            <CheckIcon className="w-4 h-4" />
          ) : (
            <CopyIcon className="w-4 h-4" />
          )}
        </button>

        {/* Modifica */}
        <button
          onClick={() => onEdit(field)}
          className="p-2 rounded-lg transition-colors hover:opacity-80"
          style={{
            backgroundColor: `${primaryColor}20`,
            color: primaryColor,
          }}
          aria-label={`Modifica ${field.label}`}
          title="Modifica"
        >
          <PencilIcon className="w-4 h-4" />
        </button>

        {/* Elimina campo custom o svuota campo predefinito */}
        <button
          onClick={() => (isCustom ? onDelete(field.key) : onClear(field.key))}
          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          aria-label={
            isCustom ? `Elimina ${field.label}` : `Svuota ${field.label}`
          }
          title={isCustom ? "Elimina" : "Svuota"}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * AnagraficaBox - Bento Box per i dati anagrafici
 *
 * Box specializzato per contenere informazioni di contatto/cliente.
 * Ha campi predefiniti + possibilità di aggiungerne di custom.
 *
 * @param {string} title - Titolo del box
 * @param {object} fields - Oggetto con i valori dei campi { cliente, luogo, iva, email, telefono, ...custom }
 * @param {array} customFields - Array di campi custom [{ key, label }]
 * @param {boolean} isPinned - Se il box è fissato in alto
 * @param {function} onPinToggle - Callback quando si clicca sul pin
 * @param {function} onTitleChange - Callback per cambiare il titolo
 * @param {function} onFieldsChange - Callback quando cambiano i campi
 * @param {function} onCustomFieldsChange - Callback quando cambiano i campi custom
 * @param {function} onDelete - Callback per eliminare il box
 */
const AnagraficaBox = ({
  title = "Anagrafica",
  fields = {},
  customFields = [],
  isPinned = false,
  onPinToggle,
  onTitleChange,
  onFieldsChange,
  onCustomFieldsChange,
  onDelete,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingFieldKey, setDeletingFieldKey] = useState(null);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [copiedFieldKey, setCopiedFieldKey] = useState(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearingFieldKey, setClearingFieldKey] = useState(null);

  const { colors, accentColor, isDark } = useTheme();

  // Ottieni il colore primario del tema
  const themeColors =
    colors[accentColor]?.[isDark ? "dark" : "light"] ||
    colors.teal[isDark ? "dark" : "light"];
  const primaryColor = themeColors.primary;

  // Menu aggiuntivo per il box anagrafica
  const anagraficaMenuItems = [
    {
      label: "Aggiungi campo",
      icon: <PlusIcon className="w-5 h-5" />,
      onClick: () => setIsAddFieldModalOpen(true),
    },
  ];

  // Costruisci la lista completa dei campi (predefiniti + custom)
  const getAllFields = () => {
    const allFields = [];

    // Aggiungi campi predefiniti
    PREDEFINED_FIELDS.forEach((predefined) => {
      allFields.push({
        key: predefined.key,
        label: predefined.label,
        value: fields[predefined.key] || "",
        isCustom: false,
      });
    });

    // Aggiungi campi custom
    customFields.forEach((custom) => {
      allFields.push({
        key: custom.key,
        label: custom.label,
        value: fields[custom.key] || "",
        isCustom: true,
      });
    });

    return allFields;
  };

  // Copia il valore di un campo negli appunti
  const handleCopyField = (field) => {
    if (field.value && field.value.trim()) {
      navigator.clipboard.writeText(field.value.trim());
      setCopiedFieldKey(field.key);
      // Reset dopo 2 secondi
      setTimeout(() => setCopiedFieldKey(null), 2000);
    }
  };

  // Avvia svuotamento campo predefinito (con conferma)
  const handleStartClearField = (fieldKey) => {
    setClearingFieldKey(fieldKey);
    setIsClearModalOpen(true);
  };

  // Conferma svuotamento campo
  const handleConfirmClearField = () => {
    if (clearingFieldKey) {
      const newFields = { ...fields, [clearingFieldKey]: "" };
      onFieldsChange?.(newFields);
    }
    setIsClearModalOpen(false);
    setClearingFieldKey(null);
  };

  // Annulla svuotamento campo
  const handleCancelClearField = () => {
    setIsClearModalOpen(false);
    setClearingFieldKey(null);
  };

  // Avvia la modifica di un campo
  const handleStartEditField = (field) => {
    setEditingField(field);
    setIsEditModalOpen(true);
  };

  // Conferma modifica campo
  const handleConfirmEditField = (value) => {
    if (editingField) {
      const newFields = { ...fields, [editingField.key]: value.trim() };
      onFieldsChange?.(newFields);
    }
    setIsEditModalOpen(false);
    setEditingField(null);
  };

  // Chiudi modal modifica senza salvare
  const handleCancelEditField = () => {
    setIsEditModalOpen(false);
    setEditingField(null);
  };

  // Avvia eliminazione campo custom
  const handleStartDeleteField = (fieldKey) => {
    setDeletingFieldKey(fieldKey);
    setIsDeleteModalOpen(true);
  };

  // Conferma eliminazione campo custom
  const handleConfirmDeleteField = () => {
    if (deletingFieldKey) {
      // Rimuovi il campo custom dalla lista
      const newCustomFields = customFields.filter(
        (f) => f.key !== deletingFieldKey
      );
      onCustomFieldsChange?.(newCustomFields);

      // Rimuovi anche il valore dal fields
      const newFields = { ...fields };
      delete newFields[deletingFieldKey];
      onFieldsChange?.(newFields);
    }
    setIsDeleteModalOpen(false);
    setDeletingFieldKey(null);
  };

  // Annulla eliminazione campo
  const handleCancelDeleteField = () => {
    setIsDeleteModalOpen(false);
    setDeletingFieldKey(null);
  };

  // Conferma aggiunta nuovo campo custom
  const handleConfirmAddField = (fieldName) => {
    const trimmedName = fieldName.trim();
    // Genera una key unica per il campo
    const key = `custom_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const newCustomField = { key, label: trimmedName };
    onCustomFieldsChange?.([...customFields, newCustomField]);
    setIsAddFieldModalOpen(false);
  };

  // Chiudi modal aggiunta campo
  const handleCancelAddField = () => {
    setIsAddFieldModalOpen(false);
  };

  // Validazione nome campo
  const validateFieldName = (value) => {
    const trimmed = value.trim();
    if (trimmed.length < 1) return "Il nome non può essere vuoto";
    if (trimmed.length > 30) return "Il nome non può superare 30 caratteri";
    // Controlla se esiste già un campo con lo stesso nome
    const allFields = getAllFields();
    const exists = allFields.some(
      (f) => f.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return "Esiste già un campo con questo nome";
    return null;
  };

  // Validazione valore campo
  const validateFieldValue = (value) => {
    if (value.length > 200) return "Il valore non può superare 200 caratteri";
    return null;
  };

  const allFieldsList = getAllFields();
  const filledFieldsCount = allFieldsList.filter(
    (f) => f.value && f.value.trim().length > 0
  ).length;

  return (
    <>
      <BaseBentoBox
        title={title}
        badgeCount={
          filledFieldsCount > 0
            ? `${filledFieldsCount}/${allFieldsList.length}`
            : null
        }
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onTitleChange={onTitleChange}
        onDelete={onDelete}
        menuItems={anagraficaMenuItems}
      >
        {/* Lista campi */}
        <div className="space-y-2">
          {allFieldsList.map((field) => (
            <AnagraficaFieldRow
              key={field.key}
              field={field}
              onEdit={handleStartEditField}
              onDelete={handleStartDeleteField}
              onClear={handleStartClearField}
              onCopy={handleCopyField}
              primaryColor={primaryColor}
              isCustom={field.isCustom}
              copiedFieldKey={copiedFieldKey}
            />
          ))}
        </div>
      </BaseBentoBox>

      {/* Modal per modificare valore campo */}
      <InputModal
        isOpen={isEditModalOpen}
        title={`Modifica ${editingField?.label || "campo"}`}
        label={editingField?.label || "Valore"}
        placeholder={`Inserisci ${
          editingField?.label?.toLowerCase() || "valore"
        }...`}
        initialValue={editingField?.value || ""}
        confirmText="Salva"
        validate={validateFieldValue}
        onConfirm={handleConfirmEditField}
        onClose={handleCancelEditField}
        zIndex={1020}
      />

      {/* Modal per aggiungere nuovo campo */}
      <InputModal
        isOpen={isAddFieldModalOpen}
        title="Nuovo campo"
        label="Nome del campo"
        placeholder="Es: Codice Fiscale..."
        initialValue=""
        confirmText="Aggiungi"
        validate={validateFieldName}
        onConfirm={handleConfirmAddField}
        onClose={handleCancelAddField}
        zIndex={1020}
      />

      {/* Modal di conferma eliminazione campo */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Elimina campo"
        message="Sei sicuro di voler eliminare questo campo personalizzato? Il valore inserito andrà perso."
        confirmText="Elimina"
        cancelText="Annulla"
        onConfirm={handleConfirmDeleteField}
        onCancel={handleCancelDeleteField}
        isDanger={true}
        zIndex={1020}
      />

      {/* Modal di conferma svuotamento campo predefinito */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Svuota campo"
        message="Sei sicuro di voler svuotare questo campo? Il valore inserito andrà perso."
        confirmText="Svuota"
        cancelText="Annulla"
        onConfirm={handleConfirmClearField}
        onCancel={handleCancelClearField}
        isDanger={true}
        zIndex={1020}
      />
    </>
  );
};

export default AnagraficaBox;
