import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="container-card max-w-2xl p-10 text-center">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-fuchsia-500">
          Invest Smarter with Crypto Royal
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Track earnings, deposit with QR, withdraw to bank, all in a beautiful
          dashboard.
        </p>
        <div className="mt-6 flex gap-4 justify-center">
          <Link href="/register" className="btn-primary rounded-2xl p-5">
            Create account
          </Link>
          <Link href="/login" className="btn-outline rounded-2xl p-5">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
