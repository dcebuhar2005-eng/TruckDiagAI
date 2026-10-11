export function Kostur({ redova = 3 }: { redova?: number }) {
  return (
    <div aria-busy className="animate-pulse">
      <div className="svjetlucanje mb-3 h-4 w-40 rounded-full" />
      <div className="svjetlucanje mb-8 h-10 w-72 max-w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: redova }, (_, i) => (
          <div key={i} className={`svjetlucanje h-44 rounded-[20px] ${i === 0 ? "lg:col-span-2" : ""}`} />
        ))}
      </div>
    </div>
  );
}
