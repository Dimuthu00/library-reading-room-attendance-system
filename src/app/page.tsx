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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4f2ee] text-[#7d5b4a] p-6 font-sans">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-semibold tracking-tight mb-3 text-[#7d5b4a]">
          Library Reading Room
        </h1>
        <p className="text-[#a89689] text-xl">
          Self-Service 24/7 Attendance Gateway
        </p>
      </div>

      <div className="relative w-full max-w-lg aspect-square bg-white rounded-4xl overflow-hidden shadow-[0_20px_60px_rgba(125,91,74,0.14)] border border-[#efe6df] flex items-center justify-center">
        {/* Display Camera Permission Error if it happens */}
        {cameraError ? (
          <div className="text-center p-6 text-[#d87c5f]">
            <div className="text-5xl mb-4">📷</div>
            <p className="font-semibold text-lg">{cameraError}</p>
            <p className="text-base mt-2 text-[#a89689] leading-relaxed max-w-sm mx-auto">
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
            <div className="absolute inset-0 border-2 border-dashed border-[#dfc4a2] m-16 rounded-3xl pointer-events-none flex items-center justify-center bg-white/5">
              {status === "processing" && (
                <div className="bg-[#7d5b4a]/90 text-white px-5 py-3 rounded-xl text-base font-medium tracking-wide animate-pulse shadow-lg">
                  Verifying Credentials...
                </div>
              )}
            </div>
          </>
        ) : null}

        {status === "success" && feedback && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-fade-in ${
              feedback.type === "CHECK_IN" ? "bg-[#e9f6ef]" : "bg-[#fff3ea]"
            }`}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 text-4xl ${
                feedback.type === "CHECK_IN"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-[#f0dfd8] text-[#d87c5f]"
              }`}
            >
              {feedback.type === "CHECK_IN" ? "✓" : "→"}
            </div>
            <h2 className="text-4xl font-semibold mb-2 text-[#7d5b4a]">{feedback.studentName}</h2>
            <p className="text-2xl font-medium text-[#a89689] mb-1">
              {feedback.message}
            </p>
            <span className="text-sm uppercase tracking-widest text-[#bcaaa0] mt-4">
              Status:{" "}
              {feedback.type === "CHECK_IN" ? "Checked In" : "Checked Out"}
            </span>
          </div>
        )}

        {status === "error" && feedback && (
          <div className="absolute inset-0 bg-[#fff3ea] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-20 h-20 bg-[#f0dfd8] text-[#d87c5f] rounded-full flex items-center justify-center mb-6 text-4xl font-bold">
              ✕
            </div>
            <h2 className="text-3xl font-semibold mb-2 text-[#7d5b4a]">Access Denied</h2>
            <p className="text-xl text-[#a89689] max-w-xs">{feedback.message}</p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center h-6">
        {status === "idle" && !cameraError && (
          <p className="text-[#a89689] text-base tracking-wide animate-pulse">
            Position your QR code within the camera frame
          </p>
        )}
      </div>
    </main>
  );
}
