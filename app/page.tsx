import Link from "next/link";

const products = [
  {
    title: "Operations Command Center",
    description: "Live asset risk, engineering concerns, events, and sensor trends in one operational view.",
    href: "/operations",
    tag: "OPERATIONS",
  },
  {
    title: "Asset Health",
    description: "Equipment intelligence, risk signals, potential failure modes, maintenance history, and review actions.",
    href: "/assets",
    tag: "ASSET INTELLIGENCE",
  },
  {
    title: "FieldFlow",
    description: "Ask questions against the oil & gas document corpus and retrieve grounded source material.",
    href: "/fieldflow",
    tag: "RAG / KNOWLEDGE",
  },
  {
    title: "Polygate Predict",
    description: "Predictive-maintenance benchmark models with validation and explainable feature attribution.",
    href: "/predict",
    tag: "ML / PREDICTIVE",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 lg:px-12">

        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em]">POLYGATE</p>
            <p className="mt-1 text-xs tracking-[0.18em] text-zinc-500">
              ENERGY AI
            </p>
          </div>

          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs font-medium text-emerald-300">
            SYSTEM OPERATIONAL
          </div>
        </header>

        <section className="grid gap-12 py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-28">
          <div>
            <p className="mb-5 text-xs font-semibold tracking-[0.28em] text-emerald-300">
              INDUSTRIAL AI OPERATIONS PLATFORM
            </p>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Intelligence for the energy field.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-400">
              Polygate Energy AI brings document intelligence, equipment health,
              operational signals, predictive maintenance, and engineering
              decision support into one interface.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/operations"
                className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Open Command Center
              </Link>

              <Link
                href="/fieldflow"
                className="rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold transition hover:bg-white/5"
              >
                Open FieldFlow
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-xs tracking-[0.2em] text-zinc-500">
                  CURRENT ASSET STATE
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  C-104  Main Gas Compressor
                </h2>
              </div>

              <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-300">
                CRITICAL
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-4 lg:grid-cols-2">
              {[
                ["Risk score", "92.0"],
                ["Vibration", "10.1"],
                ["Temperature", "97.8"],
                ["Sensor samples", "8"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/8 bg-black/20 p-4"
                >
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs leading-5 text-zinc-500">
              Read-only decision support. Risk and engineering hypotheses are
              generated from the available demo data and require qualified
              engineering review.
            </p>
          </div>
        </section>

        <section className="border-t border-white/10 py-16">
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[0.22em] text-zinc-500">
              PLATFORM MODULES
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              One operational intelligence layer.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {products.map((product, index) => (
              <Link
                key={product.href}
                href={product.href}
                className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.045]"
              >
                <div className="flex items-start justify-between gap-5">
                  <span className="text-xs font-semibold tracking-[0.18em] text-zinc-500">
                    0{index + 1}  {product.tag}
                  </span>

                  <span className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white">
                    
                  </span>
                </div>

                <h3 className="mt-8 text-xl font-semibold">
                  {product.title}
                </h3>

                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                  {product.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 text-xs text-zinc-600">
          Polygate Energy AI  |  FieldFlow  |  Asset Health  |  Operations  |  Predict
        </footer>

      </div>
    </main>
  );
}

