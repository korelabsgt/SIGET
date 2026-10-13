export function ConocimientoFondoModerno() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#eef6fb] dark:bg-[#0c1219]" />
      <div
        className="absolute inset-0 opacity-90 dark:opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 20% -10%, rgba(26, 149, 211, 0.22), transparent 55%),
            radial-gradient(ellipse 70% 45% at 100% 15%, rgba(44, 95, 155, 0.18), transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 100%, rgba(111, 159, 212, 0.15), transparent 55%)
          `,
        }}
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(#c5d4e0_0.75px,transparent_0.75px)] bg-size-[20px_20px] opacity-35 dark:bg-[radial-gradient(oklch(32%_0_0)_0.75px,transparent_0.75px)] dark:opacity-25"
      />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#e2edf5]/80 dark:to-[#0a1628]/90" />
    </div>
  );
}
