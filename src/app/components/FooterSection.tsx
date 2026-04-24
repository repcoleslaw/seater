type FooterSectionProps = {
  hasGeneratedPlan: boolean;
  onDownloadAndDispose: () => void;
};

export function FooterSection({ hasGeneratedPlan, onDownloadAndDispose }: FooterSectionProps) {
  return (
    <section className="rounded border p-4">
      <h2 className="text-xl font-semibold">6) Finalize</h2>
      <p className="mb-3 mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        Downloading your final CSV will immediately clear all session data.
      </p>
      <button
        className="rounded bg-purple-700 px-3 py-2 text-white disabled:bg-zinc-300"
        disabled={!hasGeneratedPlan}
        onClick={onDownloadAndDispose}
      >
        Download Final CSV and Clear Session
      </button>
    </section>
  );
}
