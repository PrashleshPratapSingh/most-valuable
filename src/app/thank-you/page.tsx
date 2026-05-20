"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ThankYouContent() {
  const searchParams = useSearchParams();
  // Stripe passes metadata back via success_url; we also append purchaseType ourselves
  const purchaseType = searchParams.get("type") || "direct";
  const isRaffle = purchaseType === "raffle";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
      <div className="mx-auto w-full max-w-xl px-6 text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/LogoWhite.png"
            alt="Most Valuable"
            width={200}
            height={56}
            className="mx-auto h-12 w-auto"
            priority
          />
        </div>

        {/* Success Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {isRaffle ? "🎉 You're In!" : "🛍️ Order Confirmed!"}
        </h1>

        <p className="mt-4 text-lg text-white/90">
          {isRaffle
            ? "Payment successful — your raffle entries have been recorded."
            : "Payment successful — your order has been placed."}
        </p>

        <div className="mt-6 rounded-lg bg-white/5 p-6 text-left">
          <h2 className="mb-3 text-lg font-semibold">What happens next?</h2>
          {isRaffle ? (
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Receipt sent to your email via Stripe</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Your raffle tickets have been assigned</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">⏳</span>
                <span>Winner will be selected when the countdown ends</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">📧</span>
                <span>We&apos;ll notify you immediately if you win!</span>
              </li>
            </ul>
          ) : (
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Receipt sent to your email via Stripe</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Your order has been received and is being processed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">📦</span>
                <span>Please allow up to 4 weeks for delivery due to high demand</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">📧</span>
                <span>We&apos;ll send tracking info to your email when it ships</span>
              </li>
            </ul>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90 w-full sm:w-auto"
          >
            ← Back to shop
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/15 w-full sm:w-auto"
          >
            Home
          </Link>
        </div>

        <p className="mt-6 text-xs text-white/60">
          {isRaffle ? "Good luck! 🍀" : "Thank you for your purchase! 🙏"}
        </p>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}

