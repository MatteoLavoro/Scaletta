import { PlusIcon, FileTextIcon } from "../icons";

/**
 * TutorialBox - Box che spiega come aggiungere i primi box
 *
 * Appare solo quando non ci sono box nel progetto.
 * Scompare automaticamente quando viene aggiunto il primo box.
 * Ha la stessa altezza di AddBentoBoxButton (aspect-square) su desktop.
 */
const TutorialBox = ({ isMobile = false }) => {
  return (
    <div
      className={`
        bg-bg-secondary 
        border border-border 
        rounded-xl
        p-5
        flex flex-col items-center justify-center
        text-center
        ${isMobile ? "" : "aspect-square w-full"}
      `}
    >
      {/* Icona principale */}
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <PlusIcon className="w-7 h-7 text-primary" />
      </div>

      {/* Titolo */}
      <h3 className="text-base font-semibold text-text-primary mb-2">
        Inizia ad aggiungere contenuti
      </h3>

      {/* Descrizione */}
      <p className="text-xs text-text-secondary mb-4 max-w-[200px]">
        I box ti permettono di organizzare note e informazioni nel progetto.
      </p>

      {/* Suggerimento */}
      <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg w-full">
        <div className="w-10 h-10 rounded-lg border-2 border-dashed border-border flex items-center justify-center shrink-0">
          <FileTextIcon className="w-5 h-5 text-text-muted" />
        </div>
        <div className="text-left">
          <p className="text-xs font-medium text-text-primary">
            {isMobile ? "Tocca il pulsante in basso" : "Clicca qui sotto"}
          </p>
          <p className="text-[10px] text-text-muted">
            per aggiungere il tuo primo box
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorialBox;
