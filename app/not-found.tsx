import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">
        404
      </h1>

      <p className="mb-6">
        Stranica nije pronađena.
      </p>

      <Link
        href="/"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Početna
      </Link>
    </div>
  );
}