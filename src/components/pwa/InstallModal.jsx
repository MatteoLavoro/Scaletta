import { Download, Share, Plus, MoreVertical, Smartphone } from "lucide-react";
import { Modal } from "../modal";
import InfoBox from "../ui/InfoBox";
import Button from "../ui/Button";
import Divider from "../ui/Divider";
import { usePWAInstall } from "../../hooks/usePWAInstall";

// Istruzioni per iOS (Safari)
const IOSInstructions = () => (
  <div className="flex flex-col gap-4">
    <InfoBox title="Come installare su iPhone/iPad" color="blue">
      <div className="flex flex-col gap-3 text-left w-full">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
            <Share className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-text-primary">1. Tocca Condividi</p>
            <p className="text-sm text-text-secondary">
              Premi l'icona di condivisione nella barra di Safari
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-text-primary">2. Aggiungi a Home</p>
            <p className="text-sm text-text-secondary">
              Scorri e seleziona "Aggiungi alla schermata Home"
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-text-primary">3. Conferma</p>
            <p className="text-sm text-text-secondary">
              Tocca "Aggiungi" per installare l'app
            </p>
          </div>
        </div>
      </div>
    </InfoBox>
  </div>
);

// Istruzioni manuali per Android (quando non è disponibile installazione diretta)
const AndroidManualInstructions = () => (
  <InfoBox title="Come installare su Android" color="green">
    <div className="flex flex-col gap-3 text-left w-full">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
          <MoreVertical className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <p className="font-medium text-text-primary">1. Apri il menu</p>
          <p className="text-sm text-text-secondary">
            Tocca i tre puntini in alto a destra in Chrome
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
          <Download className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <p className="font-medium text-text-primary">2. Installa app</p>
          <p className="text-sm text-text-secondary">
            Seleziona "Installa app" o "Aggiungi a Home"
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <p className="font-medium text-text-primary">3. Conferma</p>
          <p className="text-sm text-text-secondary">
            Tocca "Installa" per aggiungere l'app
          </p>
        </div>
      </div>
    </div>
  </InfoBox>
);

// Istruzioni manuali per Desktop
const DesktopManualInstructions = () => (
  <InfoBox title="Come installare su Desktop" color="purple">
    <div className="flex flex-col gap-3 text-left w-full">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
          <Download className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="font-medium text-text-primary">
            Cerca l'icona di installazione
          </p>
          <p className="text-sm text-text-secondary">
            Nella barra degli indirizzi del browser, cerca l'icona di
            installazione e cliccala
          </p>
        </div>
      </div>
    </div>
  </InfoBox>
);

// Box installazione diretta
const DirectInstallBox = ({ color, onInstall }) => (
  <>
    <InfoBox title="Installa l'app" color={color}>
      <div className="flex flex-col items-center gap-3">
        <Download className="w-12 h-12 text-primary opacity-80" />
        <p className="text-sm text-text-secondary text-center">
          Installa Scaletta sul tuo dispositivo per un accesso rapido e
          un'esperienza app nativa
        </p>
      </div>
    </InfoBox>

    <Button variant="primary" onClick={onInstall} className="w-full">
      <Download className="w-5 h-5" />
      Installa App
    </Button>
  </>
);

/**
 * InstallModal - Modale per installare l'app come PWA
 * Mostra istruzioni diverse in base al dispositivo/browser
 */
const InstallModal = ({ isOpen, onClose }) => {
  const { isInstallable, install, deviceInfo } = usePWAInstall();

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      onClose?.();
    }
  };

  // Render istruzioni in base al dispositivo
  const renderInstructions = () => {
    if (deviceInfo.isIOS) {
      return <IOSInstructions />;
    }

    if (deviceInfo.isAndroid) {
      if (isInstallable) {
        return (
          <div className="flex flex-col gap-4">
            <DirectInstallBox color="teal" onInstall={handleInstall} />
          </div>
        );
      }
      return (
        <div className="flex flex-col gap-4">
          <AndroidManualInstructions />
        </div>
      );
    }

    // Desktop
    if (isInstallable) {
      return (
        <div className="flex flex-col gap-4">
          <DirectInstallBox color="purple" onInstall={handleInstall} />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <DesktopManualInstructions />
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Installa Scaletta"
      variant="info"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {/* Vantaggi */}
        <InfoBox title="Perché installare?" color="teal">
          <ul className="text-sm text-text-secondary text-left space-y-1.5 w-full">
            <li>✓ Accesso rapido dalla home/desktop</li>
            <li>✓ Funziona anche offline</li>
            <li>✓ Esperienza app nativa</li>
            <li>✓ Nessun download da store</li>
          </ul>
        </InfoBox>

        <Divider spacing="sm" />

        {/* Istruzioni specifiche per dispositivo */}
        {renderInstructions()}
      </div>
    </Modal>
  );
};

export default InstallModal;
