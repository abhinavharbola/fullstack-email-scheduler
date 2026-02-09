"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Mail } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="flex flex-col items-center space-y-6 rounded-lg bg-gray-800 p-12 shadow-xl">
        <div className="rounded-full bg-blue-600 p-4">
          <Mail size={48} />
        </div>
        <h1 className="text-3xl font-bold">Reach D. Box</h1>
        <p className="text-gray-400">Manage your automated campaigns like King of Pirates.</p>
        
        <button
          onClick={() => signIn("google")}
          className="mt-6 flex items-center space-x-2 rounded-md bg-white px-6 py-3 font-semibold text-gray-900 transition hover:bg-gray-100"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}