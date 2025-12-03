import Spinner from "../components/ui/Spinner";

const LoadingPage = () => {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg-primary">
      <Spinner className="w-12 h-12 text-primary border-4 border-divider border-t-primary" />
    </div>
  );
};

export default LoadingPage;
