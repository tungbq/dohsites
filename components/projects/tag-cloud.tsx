export function TagCloud({
  legend,
  options,
  active,
  onToggle,
}: {
  legend: string;
  options: string[];
  active: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <fieldset className="flex flex-wrap items-center gap-1.5">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => {
        const isActive = active.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(option)}
            className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
              isActive
                ? "border-accent bg-accent text-background"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {option}
          </button>
        );
      })}
    </fieldset>
  );
}
