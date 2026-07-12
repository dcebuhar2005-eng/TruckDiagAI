"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <h1 className="text-3xl font-bold mb-4">
            Kritična greška
          </h1>

          <p className="mb-6">
            Aplikacija je naišla na problem.
          </p>

          <button
            onClick={() => reset()}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Osvježi
          </button>
        </div>
      </body>
    </html>
  );
}