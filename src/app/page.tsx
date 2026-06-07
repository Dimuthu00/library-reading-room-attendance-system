"use client";

import { useState, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { handleQRScan, ScanResponse } from "@/lib/attendance";

export default function KioskScanner() {
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [feedback, setFeedback] = useState<ScanResponse | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null); // New state for camera errors
  const isScanning = useRef(false);

  const handleScan = async (text: string) => {
    console.log("SCANNER DETECTED:", text); // Debug log to confirm scanner is working and capturing text

    if (isScanning.current || !text) return;

    isScanning.current = true;
    setStatus("processing");
    setCameraError(null); // Clear any previous errors

    const result = await handleQRScan(text);
    setFeedback(result);

    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
    }

    setTimeout(() => {
      setStatus("idle");
      setFeedback(null);
      isScanning.current = false;
    }, 4000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Library Reading Room
        </h1>
        <p className="text-gray-400 text-lg">
          Self-Service 24/7 Attendance Gateway
        </p>
      </div>

      <div className="relative w-full max-w-md aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 flex items-center justify-center">
        {/* Display Camera Permission Error if it happens */}
        {cameraError ? (
          <div className="text-center p-6 text-rose-400">
            <div className="text-4xl mb-4">📷</div>
            <p className="font-semibold">{cameraError}</p>
            <p className="text-sm mt-2 text-gray-500">
              Please click the lock icon in your URL bar to allow camera access,
              then refresh.
            </p>
          </div>
        ) : status === "idle" || status === "processing" ? (
          <>
            <Scanner
              onScan={(result) => {
                // The new version returns an array of detected codes
                if (result && result.length > 0) {
                  handleScan(result[0].rawValue);
                }
              }}
              onError={(error: any) => {
                console.error("Scanner Error:", error);
                if (
                  error?.name === "NotAllowedError" ||
                  error?.message?.includes("Permission")
                ) {
                  setCameraError("Camera access denied.");
                } else {
                  setCameraError(
                    "Failed to access camera. Check hardware connection.",
                  );
                }
              }}
              // You can remove the delay options as v2 handles it automatically better
            />
            <div className="absolute inset-0 border-2 border-dashed border-white/30 m-16 rounded-xl pointer-events-none flex items-center justify-center">
              {status === "processing" && (
                <div className="bg-black/60 px-4 py-2 rounded-lg text-sm font-medium tracking-wide animate-pulse">
                  Verifying Credentials...
                </div>
              )}
            </div>
          </>
        ) : null}

        {status === "success" && feedback && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-fade-in ${
              feedback.type === "CHECK_IN" ? "bg-emerald-950" : "bg-blue-950"
            }`}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 text-4xl ${
                feedback.type === "CHECK_IN"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {feedback.type === "CHECK_IN" ? "✓" : "→"}
            </div>
            <h2 className="text-3xl font-bold mb-2">{feedback.studentName}</h2>
            <p className="text-xl font-medium opacity-90 mb-1">
              {feedback.message}
            </p>
            <span className="text-xs uppercase tracking-widest opacity-50 mt-4">
              Status:{" "}
              {feedback.type === "CHECK_IN" ? "Checked In" : "Checked Out"}
            </span>
          </div>
        )}

        {status === "error" && feedback && (
          <div className="absolute inset-0 bg-rose-950 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-6 text-4xl font-bold">
              ✕
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-lg opacity-80 max-w-xs">{feedback.message}</p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center h-6">
        {status === "idle" && !cameraError && (
          <p className="text-gray-500 text-sm tracking-wide animate-pulse">
            Position your QR code within the camera frame
          </p>
        )}
      </div>
    </main>
  );
}
