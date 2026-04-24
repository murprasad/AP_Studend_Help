"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  gradeLevel: z.string().min(1, "Please select your grade level"),
  school: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isClepTrack, setIsClepTrack] = useState(false);
  const [userModule, setUserModule] = useState("ap");

  useEffect(() => {
    // Read module or track from URL param
    try {
      const params = new URLSearchParams(window.location.search);
      const module = params.get("module") || params.get("track") || "ap";
      setUserModule(module);
      if (module === "clep") {
        setIsClepTrack(true);
      }
    } catch { /* ignore */ }

    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((p) => setGoogleAvailable("google" in (p ?? {})))
      .catch(() => {});
  }, []);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!success || !registeredEmail) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/check-verified?email=${encodeURIComponent(registeredEmail)}`);
        const data = await res.json();
        if (data.verified) {
          clearInterval(pollRef.current!);
          setVerified(true);
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(pollRef.current!);
  }, [success, registeredEmail]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: `/dashboard?track=${userModule}` });
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
      setIsGoogleLoading(false);
    }
  }

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, track: userModule }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Registration failed",
          description: result.error || "Something went wrong",
          variant: "destructive",
        });
      } else {
        setRegisteredEmail(data.email);
        setSuccess(true);
      }
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    // Promote headings: h1 for the primary success message so this confirmation
    // state also satisfies "exactly one <h1>" + proper landmark structure.
    return (
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-6">
          <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
          {verified ? (
            <>
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-muted-foreground mb-6">Your account is ready. Click below to log in.</p>
              <Button onClick={() => router.push("/login")} className="w-full">
                Continue to Login
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2">Check your email!</h1>
              <p className="text-muted-foreground mb-4">
                We sent a verification link to <strong>{registeredEmail}</strong>. Click the link to activate your account.
              </p>
              <p className="text-xs text-muted-foreground mb-6">This page will update automatically once verified.</p>
              <Button variant="outline" onClick={() => router.push("/login")} className="w-full">
                Go to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Visually-hidden h1 for SEO + screen reader landmark (K3 fix 2026-04-24). */}
      <h1 className="sr-only">Create your StudentNest account</h1>
      <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          {userModule === "clep"
            ? "Start earning college credit with CLEP — free"
            : userModule === "dsst"
            ? "Start earning college credit with DSST — free"
            : userModule === "sat"
            ? "Start your SAT prep today — free"
            : userModule === "act"
            ? "Start your ACT prep today — free"
            : "Start your AP exam journey today — free"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google sign-up — only shown once GOOGLE_CLIENT_ID + SECRET are configured */}
        {googleAvailable && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-3 h-11 border-border/60 hover:bg-accent"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </Button>
            <p className="text-xs text-center text-muted-foreground -mt-1">
              One click · No password · No email verification needed
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or sign up with email</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="Alex" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Johnson" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@school.edu" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Grade Level</Label>
            <Select onValueChange={(value) => setValue("gradeLevel", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10th Grade (Sophomore)</SelectItem>
                <SelectItem value="11">11th Grade (Junior)</SelectItem>
                <SelectItem value="12">12th Grade (Senior)</SelectItem>
              </SelectContent>
            </Select>
            {errors.gradeLevel && (
              <p className="text-sm text-destructive">{errors.gradeLevel.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="school">School (Optional)</Label>
            <Input id="school" placeholder="Your high school name" {...register("school")} />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
    </>
  );
}
