"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Stethoscope } from "lucide-react"
import { auth, googleProvider } from "@/lib/firebase"
import { signInWithPopup } from "firebase/auth"
import { githubProvider } from "@/lib/firebase"
export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [signupData, setSignupData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [signinData, setSigninData] = useState({ email: '', password: '' });
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  // Dummy submit handlers
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Replace with real signup logic
    router.push(redirect);
  };
  const handleSignin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Replace with real signin logic
    router.push(redirect);
  };

  // Google sign-in handler
  const handleGoogleSignIn = async () => {
    if (!auth) return;
    try {
      await signInWithPopup(auth, googleProvider);
      router.push(redirect);
    } catch (error) {
      // Optionally show error toast
      console.error("Google sign-in error:", error);
    }
  };

  // GitHub sign-in handler
  const handleGithubSignIn = async () => {
    if (!auth) return;
    try {
      await signInWithPopup(auth, githubProvider);
      router.push(redirect);
    } catch (error) {
      // Optionally show error toast
      console.error("GitHub sign-in error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-card/50 overflow-hidden">
      <div className="w-full max-w-md h-[650px] relative overflow-visible" style={{ perspective: '1200px' }}>
        <Card className="w-full border-2 border-black shadow-lg rounded-md h-full flex flex-col">
          <CardContent className="p-8 flex flex-col items-center flex-1">
            <Stethoscope className="h-10 w-10 text-primary mb-4" />
            <div className="flex gap-4 mb-6">
              <Button
                variant={mode === 'signup' ? 'default' : 'outline'}
                className={mode === 'signup' ? 'border-2 border-black shadow-lg' : 'border-2 border-black'}
                onClick={() => setMode('signup')}
              >
                Sign Up
              </Button>
              <Button
                variant={mode === 'signin' ? 'default' : 'outline'}
                className={mode === 'signin' ? 'border-2 border-black shadow-lg' : 'border-2 border-black'}
                onClick={() => setMode('signin')}
              >
                Sign In
              </Button>
            </div>
            {mode === 'signup' ? (
              <>
                <h2 className="text-2xl font-bold mb-2 text-foreground">Sign up for X-NOSIS</h2>
                <p className="text-muted-foreground mb-6 text-center">Create your account to get started.</p>
                <form className="w-full flex flex-col gap-4 items-center" onSubmit={handleSignup}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={signupData.email}
                    onChange={e => setSignupData({ ...signupData, email: e.target.value })}
                    className="border-2 border-black rounded-md px-4 py-2 focus:outline-none w-full max-w-xs"
                    required
                  />
                  <div className="relative w-full max-w-xs">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={signupData.password}
                      onChange={e => setSignupData({ ...signupData, password: e.target.value })}
                      className="border-2 border-black rounded-md px-4 py-2 focus:outline-none w-full"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-muted rounded"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="Weight (kg)"
                    className="border-2 border-black rounded-md px-4 py-2 focus:outline-none w-full max-w-xs"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Height (cm)"
                    className="border-2 border-black rounded-md px-4 py-2 focus:outline-none w-full max-w-xs"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    className="border-2 border-black rounded-md px-4 py-2 focus:outline-none w-full max-w-xs"
                    required
                  />
                  <motion.div whileHover={{ scale: 1.04, boxShadow: "0 0 12px #e75480" }} className="w-full max-w-xs">
                    <Button type="submit" className="w-full border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                      Sign Up
                    </Button>
                  </motion.div>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-2 text-foreground">Sign in to X-NOSIS</h2>
                <p className="text-muted-foreground mb-6 text-center">Welcome back! Please sign in.</p>
                <div className="flex flex-col gap-2 mt-4 w-full">
                  <motion.div whileHover={{ scale: 1.05, boxShadow: "0 0 16px #e75480" }}>
                    <Button 
                      variant="default" 
                      className="w-full border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={handleGoogleSignIn}
                    >
                      Sign in with Google
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05, boxShadow: "0 0 16px #e75480" }}>
                    <Button 
                      variant="outline" 
                      className="w-full border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={handleGithubSignIn}
                    >
                      Sign in with GitHub
                    </Button>
                  </motion.div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
