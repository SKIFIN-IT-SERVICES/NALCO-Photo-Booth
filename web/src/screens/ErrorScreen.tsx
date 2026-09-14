import { useBooth } from "../state/BoothContext";

export default function ErrorScreen() {
  const { errorMessage, reset, goTo } = useBooth();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-nalco-navy p-8 text-center">
      <h2 className="text-3xl font-semibold text-white">Oops!</h2>
      <p className="max-w-md text-white/70">{errorMessage ?? "Something went wrong."}</p>
      <div className="flex gap-4">
        <button
          onClick={() => goTo("scene")}
          className="rounded-full bg-white/20 px-8 py-4 text-lg text-white"
        >
          Try Again
        </button>
        <button
          onClick={reset}
          className="rounded-full bg-nalco-orange px-8 py-4 text-lg font-semibold text-nalco-navy"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
