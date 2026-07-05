export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center text-white px-6">

      <h1 className="text-6xl font-bold text-yellow-400 mb-2">
        ANALITYQ
      </h1>

      <p className="text-gray-300 mb-10">
        AI Sports Intelligence
      </p>

      <input
        type="text"
        placeholder="Np. Real Madryt vs Barcelona"
        className="w-full max-w-xl p-4 rounded-xl text-black text-lg"
      />

      <button
        className="mt-6 bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-4 rounded-xl transition"
      >
        Analizuj
      </button>

    </main>
  );
}