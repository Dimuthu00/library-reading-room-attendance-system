"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Scanner } from "@yudiel/react-qr-scanner";
import { handleQRScan, ScanResponse } from "@/lib/attendance";

type ScannerStatus =
  | "idle"
  | "processing"
  | "success"
  | "error";

function getCameraErrorMessage(error: unknown): string {
  const cameraError =
    error instanceof Error ? error : new Error(String(error));

  switch (cameraError.name) {
    case "NotAllowedError":
      return "Camera permission was denied. Allow camera access in your browser settings.";

    case "NotFoundError":
      return "No camera was detected on this device.";

    case "NotReadableError":
      return "The camera is being used by another application. Close Zoom, Teams, or other camera applications.";

    case "OverconstrainedError":
      return "The selected camera does not support the requested settings.";

    case "SecurityError":
      return "The browser blocked camera access for security reasons.";

    case "AbortError":
      return "Camera initialization was interrupted. Please try again.";

    default:
      return cameraError.message || "The camera could not be started.";
  }
}

export default function KioskScanner() {
  const [status, setStatus] =
    useState<ScannerStatus>("idle");

  const [feedback, setFeedback] =
    useState<ScanResponse | null>(null);

  const [cameraActive, setCameraActive] =
    useState(false);

  const [cameraError, setCameraError] =
    useState<string | null>(null);

  const [cameraKey, setCameraKey] =
    useState(0);

  const [manualStudentId, setManualStudentId] =
    useState("");

  const isScanning = useRef(false);

  const resetTimer = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const resetScanner = () => {
    setStatus("idle");
    setFeedback(null);
    isScanning.current = false;
  };

  const processStudentId = async (studentId: string) => {
    const cleanStudentId = studentId.trim().toUpperCase();

    if (!cleanStudentId || isScanning.current) {
      return;
    }

    isScanning.current = true;
    setStatus("processing");
    setFeedback(null);

    try {
      const result = await handleQRScan(cleanStudentId);

      setFeedback(result);
      setStatus(result.success ? "success" : "error");
    } catch (error) {
      console.error("Attendance processing error:", error);

      setFeedback({
        success: false,
        message:
          "The attendance request could not be completed. Please try again.",
      } as ScanResponse);

      setStatus("error");
    }

    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }

    resetTimer.current = setTimeout(() => {
      resetScanner();
    }, 4000);
  };

  const startCamera = () => {
    setCameraError(null);
    setFeedback(null);
    setStatus("idle");

    if (
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCameraError(
        "Camera access requires HTTPS or localhost. Open this page using localhost or deploy it with HTTPS.",
      );
      return;
    }

    setCameraKey((current) => current + 1);
    setCameraActive(true);
  };

  const handleCameraError = (error: unknown) => {
    console.error("QR scanner camera error:", error);

    setCameraActive(false);
    setCameraError(getCameraErrorMessage(error));
  };

  const handleManualSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!manualStudentId.trim()) {
      return;
    }

    setCameraError(null);
    void processStudentId(manualStudentId);
    setManualStudentId("");
  };

  return (
    <main className="min-h-screen bg-[#f8f2df] text-[#4d2108]">
      {/* Top university bar */}
      <div className="bg-[#5b080a] text-[#f5ba1d]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 text-xs font-semibold sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.12em]">
            Faculty of Engineering
          </p>

          <p className="hidden text-[#ffe7a4] sm:block">
            University of Ruhuna
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="border-b-4 border-[#5b080a] bg-[#f5ba1d] shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-12 shrink-0">
              <Image
                src="/ruhuna-logo.png"
                alt="University of Ruhuna logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>

            <div>
              <h1 className="text-lg font-extrabold text-[#430506] sm:text-xl">
                Reading Room Attendance
              </h1>

              <p className="text-xs font-medium text-[#6b2c1d] sm:text-sm">
                Self-Service Attendance Gateway
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="rounded-lg border border-[#5b080a]/30 bg-[#fff4cf] px-4 py-2 text-sm font-bold text-[#5b080a] transition hover:bg-white"
          >
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8 lg:py-12">
        {/* Information panel */}
        <aside className="rounded-3xl bg-[#5b080a] p-7 text-white shadow-xl lg:p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5ba1d] text-[#5b080a]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 4h6v6H4V4Z" />
              <path d="M14 4h6v6h-6V4Z" />
              <path d="M4 14h6v6H4v-6Z" />
              <path d="M14 14h2v2h-2v-2Z" />
              <path d="M18 14h2v6h-6v-2" />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#f5ba1d]">
            Scan Your Student Pass
          </h2>

          <p className="mt-4 leading-7 text-[#f5e9dc]">
            Position your QR code inside the scanner frame.
            The system will automatically record your check-in
            or check-out.
          </p>

          <div className="mt-8 space-y-4">
            <Instruction number="1">
              Allow camera access when requested.
            </Instruction>

            <Instruction number="2">
              Hold the QR code clearly inside the frame.
            </Instruction>

            <Instruction number="3">
              Wait for the attendance confirmation.
            </Instruction>
          </div>

          <div className="mt-8 rounded-2xl border border-[#f5ba1d]/30 bg-white/10 p-4">
            <p className="text-sm font-semibold text-[#f5ba1d]">
              Camera unavailable?
            </p>

            <p className="mt-1 text-sm leading-6 text-[#f5e9dc]">
              Enter the student ID manually using the form
              below the scanner.
            </p>
          </div>
        </aside>

        {/* Scanner panel */}
        <section className="rounded-3xl border border-[#e5ce8e] bg-white p-5 shadow-[0_20px_60px_rgba(91,8,10,0.12)] sm:p-7">
          <div className="mb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[#5b080a]">
                  QR Code Scanner
                </h2>

                <p className="mt-1 text-sm text-[#8a715f]">
                  Secure reading room attendance verification
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                System Online
              </div>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-xl overflow-hidden rounded-3xl bg-[#16090a] shadow-inner">
            {/* Camera not started */}
            {!cameraActive && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f5ba1d] text-[#5b080a] shadow-lg">
                  <CameraIcon />
                </div>

                <h3 className="mt-6 text-2xl font-bold text-white">
                  Camera Ready
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-[#d9c8c0]">
                  Select the button below and allow your browser
                  to use the device camera.
                </p>

                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-7 rounded-xl bg-[#f5ba1d] px-7 py-3 font-bold text-[#5b080a] shadow-lg transition hover:bg-[#ffd052]"
                >
                  Start Camera
                </button>
              </div>
            )}

            {/* Camera error */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fff5ec] p-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fee2e2] text-rose-700">
                  <CameraOffIcon />
                </div>

                <h3 className="mt-5 text-2xl font-bold text-[#5b080a]">
                  Camera Unavailable
                </h3>

                <p className="mt-3 max-w-md text-sm leading-6 text-[#8a604d]">
                  {cameraError}
                </p>

                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-6 rounded-xl bg-[#5b080a] px-6 py-3 font-bold text-[#f5ba1d] transition hover:bg-[#741012]"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Camera */}
            {cameraActive && (
              <>
                <Scanner
                  key={cameraKey}
                  onScan={(detectedCodes) => {
                    const firstCode = detectedCodes?.[0];

                    if (firstCode?.rawValue) {
                      void processStudentId(firstCode.rawValue);
                    }
                  }}
                  onError={handleCameraError}
                  paused={status !== "idle"}
                  scanDelay={1200}
                  allowMultiple={false}
                  constraints={{
                    facingMode: {
                      ideal: "environment",
                    },
                    width: {
                      ideal: 1280,
                    },
                    height: {
                      ideal: 1280,
                    },
                  }}
                  components={{
                    finder: false,
                    torch: true,
                    zoom: true,
                  }}
                  styles={{
                    container: {
                      width: "100%",
                      height: "100%",
                    },
                    video: {
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    },
                  }}
                />

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.28),transparent_35%,transparent_65%,rgba(0,0,0,0.35))]" />

                <ScanFrame />

                {status === "idle" && (
                  <div className="pointer-events-none absolute inset-x-8 bottom-6 rounded-xl bg-black/55 px-4 py-3 text-center text-sm font-medium text-white backdrop-blur-sm">
                    Position the QR code inside the frame
                  </div>
                )}
              </>
            )}

            {/* Processing */}
            {status === "processing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#16090a]/85 p-8 text-center backdrop-blur-sm">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#f5ba1d]/25 border-t-[#f5ba1d]" />

                <h3 className="mt-5 text-xl font-bold text-white">
                  Verifying Student Pass
                </h3>

                <p className="mt-2 text-sm text-[#d9c8c0]">
                  Please wait while attendance is recorded.
                </p>
              </div>
            )}

            {/* Success */}
            {status === "success" && feedback && (
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center ${
                  feedback.type === "CHECK_IN"
                    ? "bg-emerald-50"
                    : "bg-amber-50"
                }`}
                aria-live="polite"
              >
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-full text-5xl font-bold ${
                    feedback.type === "CHECK_IN"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {feedback.type === "CHECK_IN" ? "✓" : "→"}
                </div>

                <p className="mt-6 text-sm font-bold uppercase tracking-[0.14em] text-[#8a715f]">
                  {feedback.type === "CHECK_IN"
                    ? "Check-in successful"
                    : "Check-out successful"}
                </p>

                <h3 className="mt-2 text-3xl font-extrabold text-[#5b080a]">
                  {feedback.studentName || "Student"}
                </h3>

                <p className="mt-3 text-lg text-[#806451]">
                  {feedback.message}
                </p>
              </div>
            )}

            {/* Attendance error */}
            {status === "error" && feedback && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50 p-8 text-center"
                aria-live="assertive"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-100 text-5xl font-bold text-rose-700">
                  ×
                </div>

                <h3 className="mt-6 text-3xl font-extrabold text-[#5b080a]">
                  Unable to Record Attendance
                </h3>

                <p className="mt-3 max-w-md text-lg text-[#8a604d]">
                  {feedback.message}
                </p>
              </div>
            )}
          </div>

          {/* Manual entry */}
          <div className="mt-6 rounded-2xl border border-[#ead8a9] bg-[#fff9e9] p-4 sm:p-5">
            <div className="mb-3">
              <h3 className="font-bold text-[#5b080a]">
                Manual Student ID
              </h3>

              <p className="mt-1 text-xs text-[#8a715f]">
                Use this option only when the camera is unavailable.
              </p>
            </div>

            <form
              onSubmit={handleManualSubmit}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="text"
                value={manualStudentId}
                onChange={(event) =>
                  setManualStudentId(event.target.value)
                }
                placeholder="Example: EG/2022/5317"
                disabled={status === "processing"}
                className="min-w-0 flex-1 rounded-xl border border-[#d9c286] bg-white px-4 py-3 font-mono uppercase text-[#5b080a] outline-none transition placeholder:normal-case placeholder:text-[#ac9986] focus:border-[#f5ba1d] focus:ring-4 focus:ring-[#f5ba1d]/20 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={
                  !manualStudentId.trim() ||
                  status === "processing"
                }
                className="rounded-xl bg-[#5b080a] px-6 py-3 font-bold text-[#f5ba1d] transition hover:bg-[#741012] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit ID
              </button>
            </form>
          </div>
        </section>
      </div>

      <footer className="border-t border-[#dfcc97] bg-[#fff8e4] px-4 py-5 text-center text-xs text-[#846b59]">
        Faculty of Engineering · University of Ruhuna ·
        Reading Room Attendance System
      </footer>
    </main>
  );
}

function Instruction({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5ba1d] text-xs font-extrabold text-[#5b080a]">
        {number}
      </span>

      <p className="pt-1 text-sm text-[#f5e9dc]">
        {children}
      </p>
    </div>
  );
}

function ScanFrame() {
  const corner =
    "absolute h-14 w-14 border-[#f5ba1d]";

  return (
    <div className="pointer-events-none absolute inset-12 sm:inset-16">
      <span
        className={`${corner} left-0 top-0 rounded-tl-2xl border-l-4 border-t-4`}
      />
      <span
        className={`${corner} right-0 top-0 rounded-tr-2xl border-r-4 border-t-4`}
      />
      <span
        className={`${corner} bottom-0 left-0 rounded-bl-2xl border-b-4 border-l-4`}
      />
      <span
        className={`${corner} bottom-0 right-0 rounded-br-2xl border-b-4 border-r-4`}
      />

      <div className="absolute left-4 right-4 top-1/2 h-0.5 animate-pulse bg-[#f5ba1d] shadow-[0_0_12px_#f5ba1d]" />
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-9 w-9"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h3l1.5-2h7L17 7h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2Z"
      />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function CameraOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-9 w-9"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M9 5h6l2 2h3a2 2 0 012 2v8M7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h14"
      />
    </svg>
  );
}