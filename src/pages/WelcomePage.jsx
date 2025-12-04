import { ListChecksIcon, UsersIcon, ZapIcon } from "../components/icons";
import Button from "../components/ui/Button";

const features = [
  {
    icon: UsersIcon,
    title: "Collaborazione",
    description: "Lavora in team con poteri uguali",
  },
  {
    icon: ListChecksIcon,
    title: "Organizzazione",
    description: "Gestisci progetti e task facilmente",
  },
  {
    icon: ZapIcon,
    title: "Velocità",
    description: "Interfaccia moderna e reattiva",
  },
];

const WelcomePage = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-5 py-8 pb-4">
          <div className="w-full max-w-sm flex flex-col items-center gap-6">
            {/* Logo */}
            <div className="w-20 h-20 flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/20 shadow-lg shadow-primary/10">
              <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
                <rect
                  x="8"
                  y="10"
                  width="48"
                  height="7"
                  rx="3.5"
                  className="fill-primary"
                />
                <rect
                  x="8"
                  y="22"
                  width="40"
                  height="7"
                  rx="3.5"
                  className="fill-primary opacity-75"
                />
                <rect
                  x="8"
                  y="34"
                  width="32"
                  height="7"
                  rx="3.5"
                  className="fill-primary opacity-50"
                />
                <rect
                  x="8"
                  y="46"
                  width="24"
                  height="7"
                  rx="3.5"
                  className="fill-primary opacity-30"
                />
              </svg>
            </div>

            {/* Brand Text */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-text-primary tracking-tight">
                Scaletta
              </h1>
              <p className="text-base text-text-secondary leading-relaxed px-2">
                Organizza i tuoi progetti in team
              </p>
            </div>

            {/* Features */}
            <div className="w-full flex flex-col gap-3 mt-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl border border-divider/50"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-lg shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-text-primary">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="shrink-0 p-5 pt-3 pb-6 bg-bg-primary border-t border-divider/30">
        <div className="w-full max-w-sm mx-auto flex flex-col gap-2.5">
          <Button
            onClick={onRegister}
            variant="primary"
            size="md"
            className="w-full"
          >
            Registrati
          </Button>
          <Button
            onClick={onLogin}
            variant="secondary"
            size="md"
            className="w-full"
          >
            Accedi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
