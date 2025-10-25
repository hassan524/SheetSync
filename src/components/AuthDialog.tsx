"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation"; 

export default function AuthDialog() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { isAuthDialogOpen, setIsAuthDialogOpen, login, signup, signInWithGoogle } = useAuth()
  const router = useRouter()

  const handleGoogleSignIn = () => {
    signInWithGoogle()
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = isLogin
      ? await login(email, password)
      : await signup(email, password, firstName, lastName);

    if (res.success) {
      console.log(res.message);

      setIsAuthDialogOpen(false);

      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } else {
      console.error(res.message);
    }
  };

  const toggleMode = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
      <DialogContent className="max-w-lg w-full p-8 rounded-xl">
        <div className={`flex flex-col gap-6 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          <DialogHeader className="flex flex-col gap-2 text-center items-center">
            <DialogTitle className="text-4xl font-bold">
              {isLogin ? "Welcome Back" : "Get Started for Free"}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {isLogin ? "Sign in to your account" : "Create your account to continue"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Google Sign In Button */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 h-12"
              onClick={handleGoogleSignIn}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Sign Up Form */}
            {!isLogin && (
              <div className="flex flex-col gap-4">
                {/* First Name and Last Name in one line */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12"
                    required
                  />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />

                <Input
                  id="password"
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required
                />

                <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold">
                  Get Started
                </Button>
              </div>
            )}

            {/* Login Form */}
            {isLogin && (
              <div className="flex flex-col gap-4">
                <Input
                  id="loginEmail"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />

                <div className="flex flex-col gap-2">
                  <Input
                    id="loginPassword"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                    required
                  />
                  <button className="text-sm text-primary hover:underline text-right">
                    Forgot password?
                  </button>
                </div>

                <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold">
                  Sign In
                </Button>
              </div>
            )}

            {/* Toggle between Sign Up and Login */}
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={toggleMode}
                  className="text-primary font-semibold hover:underline"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>

            {/* Footer */}
            <p className="text-xs text-center text-muted-foreground px-2">
              By continuing, you agree to our{" "}
              <span className="text-primary hover:underline cursor-pointer font-medium">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-primary hover:underline cursor-pointer font-medium">
                Privacy Policy
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}