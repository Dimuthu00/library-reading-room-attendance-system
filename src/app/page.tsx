import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#2c1406] text-white">
      <Image
        src="/faculty-gate.png"
        alt="Faculty of Engineering, University of Ruhuna entrance"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,9,2,0.68)_0%,rgba(20,9,2,0.56)_38%,rgba(20,9,2,0.82)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(36,16,4,0.16)_55%,rgba(26,11,2,0.52)_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-center">
          <div className="rounded-3xl border border-[#f4bd3f]/45 bg-[#4f2509]/90 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <Image
              src="/ruhuna-logo.png"
              alt="University of Ruhuna logo"
              width={98}
              height={108}
              priority
              className="h-24 w-auto rounded-2xl object-contain sm:h-28"
            />
          </div>
        </header>

        <section className="mx-auto mt-5 w-full max-w-5xl text-center">
          <div className="inline-block rounded-2xl border border-white/10 bg-[#21170f]/90 px-6 py-4 shadow-[0_22px_55px_rgba(0,0,0,0.42)] backdrop-blur-md sm:px-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#f2b937] sm:text-5xl lg:text-6xl">
              Reading Room Attendance System
            </h1>
          </div>

          <p className="mt-4 text-lg font-semibold text-white drop-shadow-lg sm:text-2xl">
            Faculty of Engineering, University of Ruhuna
          </p>
        </section>

        <section className="mx-auto mt-10 grid w-full max-w-6xl gap-5 md:grid-cols-3">
          <article className="rounded-3xl border border-white/25 bg-[#181818]/65 p-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-[#f2b937]">About Library</h2>
            <p className="mt-4 leading-7 text-white/90">
              The Faculty Reading Room provides a secure and quiet environment
              for study, academic work, and research. This system manages
              student attendance and helps library staff monitor occupancy in
              real time.
            </p>
          </article>

          <article className="rounded-3xl border border-white/25 bg-[#181818]/65 p-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-[#f2b937]">Address</h2>
            <div className="mt-4 space-y-1 leading-7 text-white/90">
              <p>Faculty of Engineering</p>
              <p>University of Ruhuna</p>
              <p>Hapugala, Galle</p>
              <p>Sri Lanka - 80000</p>
            </div>
          </article>

          <article className="rounded-3xl border border-white/25 bg-[#181818]/65 p-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-[#f2b937]">Library Access</h2>
            <p className="mt-4 leading-7 text-white/90">
              Students can record entry and exit using their QR pass. Library
              administrators can manage student passes, view live occupancy,
              and review attendance reports from the dashboard.
            </p>
          </article>
        </section>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex min-w-60 items-center justify-center rounded-full border-2 border-white bg-[#8a4b18] px-8 py-3.5 text-base font-bold text-white shadow-[0_14px_35px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#a55b1e] focus:outline-none focus:ring-4 focus:ring-[#f2b937]/35"
          >
            Login to Dashboard
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </Link>

          <Link
            href="/scanner"
            className="inline-flex min-w-60 items-center justify-center rounded-full border border-[#f2b937]/70 bg-[#21170f]/75 px-8 py-3.5 text-base font-bold text-[#f7c859] shadow-[0_14px_35px_rgba(0,0,0,0.22)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#2d2015] focus:outline-none focus:ring-4 focus:ring-[#f2b937]/30"
          >
            Open QR Scanner
          </Link>
        </div>

        <footer className="mt-auto pt-8 text-center text-sm text-white/70">
          © {new Date().getFullYear()} Faculty of Engineering, University of
          Ruhuna
        </footer>
      </div>
    </main>
  );
}