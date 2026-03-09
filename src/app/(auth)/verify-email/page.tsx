"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. The link may have expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  return (
    <Card className="w-full max-w-md text-center">
      <CardContent className="pt-8 pb-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 text-indigo-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold mb-2">Verifying your email...</h2>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Continue to Login
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button variant="outline" onClick={() => router.push("/register")} className="w-full">
              Back to Register
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <Loader2 className="h-16 w-16 text-indigo-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          </CardContent>
        </Card>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
