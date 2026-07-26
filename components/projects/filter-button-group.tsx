export function FilterButtonGroup({
  legend,
  options,
  active,
  onChange,
}: {
  legend: string;
  options: string[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{legend}</legend>
      {["All", ...options].map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={active === option}
          onClick={() => onChange(option)}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            active === option
              ? "border-accent bg-accent text-background"
              : "border-border text-muted hover:text-foreground"
          }`}
        >
          {option}
        </button>
      ))}
    </fieldset>
  );
}
