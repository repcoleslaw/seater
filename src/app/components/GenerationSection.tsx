type GenerationSectionProps = {
  hasGeneratedPlan: boolean;
  onGenerate: () => void;
  onRetry: () => void;
};

export function GenerationSection({
  hasGeneratedPlan,
  onGenerate,
  onRetry,
}: GenerationSectionProps) {
  return (
    <section className="grid gap-3 rounded border p-4">
      <h2 className="text-xl font-semibold">4) Generation</h2>
      <div className="flex flex-wrap gap-2">
        <button className="rounded bg-emerald-600 px-3 py-2 text-white" onClick={onGenerate}>
          Generate Plan
        </button>
        <button
          className="rounded bg-zinc-700 px-3 py-2 text-white disabled:bg-zinc-300"
          onClick={onRetry}
          disabled={!hasGeneratedPlan}
        >
          Try Again
        </button>
      </div>
    </section>
  );
}
