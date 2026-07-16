import { useState } from "react";
import Modal from "./Modal";
import SplitModal from "./SplitModal";

// ─── Contenuto demo: scheletro di righe grigie ────────────────────────────────

const DemoSkeleton = ({ lines = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-3 bg-divider rounded-full ${
          i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-3/4" : "w-5/6"
        }`}
      />
    ))}
  </div>
);

const InfoBox = ({ children }) => (
  <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-text-secondary leading-relaxed">
    {children}
  </div>
);

// ─── Configurazioni demo disponibili ─────────────────────────────────────────

const DEMO_CONFIGS = [
  {
    id: "two-columns",
    label: "2 Colonne",
    description: "Due pannelli affiancati orizzontalmente",
    maxWidth: "820px",
  },
  {
    id: "two-rows",
    label: "2 Righe",
    description: "Due pannelli sovrapposti verticalmente",
    maxWidth: "480px",
  },
  {
    id: "mixed",
    label: "3 Pannelli (misto)",
    description: "Due in colonna a sinistra + uno alto a destra",
    maxWidth: "940px",
  },
  {
    id: "single",
    label: "Pannello Singolo",
    description: "Un solo pannello — comportamento identico a Modal",
    maxWidth: "480px",
  },
];

// ─── Costruisce il layout in base all'id selezionato ─────────────────────────

const buildLayout = (id, onCloseSplit) => {
  switch (id) {
    case "two-columns":
      return {
        type: "row",
        children: [
          {
            type: "panel",
            id: "left",
            title: "Pannello Sinistro",
            content: (
              <div className="space-y-4">
                <InfoBox>
                  Su <strong>mobile</strong>: la freccia ← appare qui (pannello
                  topmost-leftmost). Su <strong>desktop</strong>: la X appare
                  nel pannello a destra (topmost-rightmost).
                </InfoBox>
                <DemoSkeleton lines={7} />
              </div>
            ),
          },
          {
            type: "panel",
            id: "right",
            title: "SplitModal — 2 Colonne",
            content: (
              <div className="space-y-4">
                <InfoBox>
                  Entrambi i pannelli condividono overlay e sistema di chiusura.
                  Ognuno ha il proprio contenuto scrollabile indipendente.
                </InfoBox>
                <DemoSkeleton lines={7} />
              </div>
            ),
            confirmText: "← Torna alla lista",
            onConfirm: onCloseSplit,
          },
        ],
      };

    case "two-rows":
      return {
        type: "column",
        children: [
          {
            type: "panel",
            id: "top",
            title: "SplitModal — 2 Righe",
            content: (
              <div className="space-y-4">
                <InfoBox>
                  Pannello superiore. In un layout colonna il pannello topmost è
                  quello più in alto, quindi su desktop la X è qui
                  (topmost-rightmost coincide con il primo in una colonna).
                </InfoBox>
                <DemoSkeleton lines={4} />
              </div>
            ),
          },
          {
            type: "panel",
            id: "bottom",
            title: "Pannello Inferiore",
            content: (
              <div className="space-y-4">
                <InfoBox>
                  Pannello inferiore. Ha il suo bottone di conferma
                  indipendente.
                </InfoBox>
                <DemoSkeleton lines={4} />
              </div>
            ),
            confirmText: "← Torna alla lista",
            onConfirm: onCloseSplit,
          },
        ],
      };

    case "mixed":
      return {
        type: "row",
        children: [
          {
            type: "column",
            flex: 1,
            children: [
              {
                type: "panel",
                id: "step1",
                title: "Fase 1",
                content: (
                  <div className="space-y-3">
                    <InfoBox>
                      Prima fase. L'altezza è quella naturale del contenuto.
                    </InfoBox>
                    <DemoSkeleton lines={3} />
                  </div>
                ),
              },
              {
                type: "panel",
                id: "step2",
                title: "Fase 2",
                content: (
                  <div className="space-y-3">
                    <InfoBox>
                      Seconda fase. Il pannello destro si allunga
                      automaticamente per uguagliare l'altezza totale di questi
                      due pannelli sommati.
                    </InfoBox>
                    <DemoSkeleton lines={3} />
                  </div>
                ),
              },
            ],
          },
          {
            type: "panel",
            id: "preview",
            title: "SplitModal — 3 Pannelli",
            flex: 1,
            content: (
              <div className="space-y-4">
                <InfoBox>
                  Layout misto: colonna con 2 pannelli a sinistra + 1 pannello
                  alto a destra. L'altezza del pannello destro si adatta
                  automaticamente alla somma delle altezze dei due pannelli di
                  sinistra (comportamento flex nativo).
                </InfoBox>
                <DemoSkeleton lines={10} />
              </div>
            ),
            confirmText: "← Torna alla lista",
            onConfirm: onCloseSplit,
          },
        ],
      };

    case "single":
      return {
        type: "panel",
        id: "main",
        title: "SplitModal — Pannello Singolo",
        content: (
          <div className="space-y-4">
            <InfoBox>
              Un singolo pannello si comporta esattamente come un Modal
              classico, ma usa la struttura di SplitModal. Utile quando si
              desidera passare da layout singolo a multi-pannello senza cambiare
              componente.
            </InfoBox>
            <DemoSkeleton lines={6} />
          </div>
        ),
        confirmText: "← Torna alla lista",
        onConfirm: onCloseSplit,
      };

    default:
      return null;
  }
};

// ─── SplitModalDemo ───────────────────────────────────────────────────────────

/**
 * SplitModalDemo — componente demo interattivo.
 *
 * Struttura: modale picker (resta aperto sotto) → SplitModal demo (skipHistory=true).
 * L'utente può tornare alla lista con il bottone "Torna alla lista" nel pannello,
 * senza dover chiudere il picker e riaprirlo.
 *
 * @param {boolean}  isOpen  - Stato apertura del picker
 * @param {function} onClose - Callback chiusura del picker
 */
const SplitModalDemo = ({ isOpen, onClose }) => {
  const [activeDemoId, setActiveDemoId] = useState(null);
  const [isSplitOpen, setIsSplitOpen] = useState(false);

  const handlePickDemo = (config) => {
    setActiveDemoId(config.id);
    setIsSplitOpen(true);
    // Il picker resta aperto sotto il SplitModal
  };

  const handleCloseSplit = () => {
    setIsSplitOpen(false);
    setActiveDemoId(null);
    // Il picker riemerge automaticamente
  };

  const activeConfig = DEMO_CONFIGS.find((d) => d.id === activeDemoId);
  const layout = activeDemoId
    ? buildLayout(activeDemoId, handleCloseSplit)
    : null;

  return (
    <>
      {/* Picker modal — resta aperto sotto il SplitModal demo */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Demo SplitModal"
        variant="info"
      >
        <div className="space-y-3 py-1">
          <p className="text-sm text-text-secondary pb-1">
            Seleziona una configurazione da esplorare. Puoi tornare qui con il
            bottone interno al demo.
          </p>
          {DEMO_CONFIGS.map((config) => (
            <button
              key={config.id}
              onClick={() => handlePickDemo(config)}
              className="w-full p-4 flex items-center gap-4 bg-bg-tertiary/50 hover:bg-bg-tertiary border border-border/50 hover:border-border rounded-xl transition-all duration-200 text-left group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {config.label}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {config.description}
                </p>
              </div>
              <span className="text-text-muted text-sm shrink-0">→</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* SplitModal demo — skipHistory perché è sopra il picker */}
      {layout && (
        <SplitModal
          isOpen={isSplitOpen}
          onClose={handleCloseSplit}
          layout={layout}
          maxWidth={activeConfig?.maxWidth}
          skipHistory
        />
      )}
    </>
  );
};

export default SplitModalDemo;
