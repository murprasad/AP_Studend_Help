"use client";

import { useState, useEffect, useRef } from "react";
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

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
    return (
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-6">
          <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
          {verified ? (
            <>
              <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
              <p className="text-muted-foreground mb-6">Your account is ready. Click below to log in.</p>
              <Button onClick={() => router.push("/login")} className="w-full">
                Continue to Login
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Check your email!</h2>
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Start your AP exam journey today — free</CardDescription>
      </CardHeader>
      <CardContent>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          <Button type="submit" className="w-full" disabled={isLoading}>
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
  );
}
