"use client";

export function PreviewModeToggle({
  mode,
  onChange,
}: {
  mode: "free" | "premium";
  onChange: (mode: "free" | "premium") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
      {(["free", "premium"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-full px-4 py-2 text-sm font-black transition ${
            mode === item ? "bg-amber-200 text-[#06101f]" : "text-slate-300 hover:text-white"
          }`}
        >
          {item === "free" ? "Free" : "Premium"}
        </button>
      ))}
    </div>
  );
}
