"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4">
        Došlo je do greške
      </h1>

      <p className="text-gray-600 mb-6 text-center">
        Nešto je pošlo po zlu. Pokušaj ponovno.
      </p>

      <button
        onClick={() => reset()}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Pokušaj ponovno
      </button>
    </div>
  );
}