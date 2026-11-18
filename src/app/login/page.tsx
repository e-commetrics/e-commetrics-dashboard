"use client";

import { useRouter } from "next/navigation";
import Login from "@/components/login";

// Dashboard sign-in (was the "Ingresar al Dashboard" option of the old entry screen on "/").
export default function LoginRoute() {
  const router = useRouter();
  return (
    <main id="main-content" tabIndex={-1} className="overflow-x-hidden min-h-screen focus:outline-none">
      <Login goToLanding={() => router.push("/")} />
    </main>
  );
}
