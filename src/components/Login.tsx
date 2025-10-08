"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Top Section */}
      <form className="flex flex-col gap-5">
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          className="focus-visible:ring-green-100 py-5"
        />
        <Input
          id="password"
          type="password"
          placeholder="Password"
          className="focus-visible:ring-green-600 py-5"
        />

        {/* <div className="flex items-center space-x-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm">
            Remember me
          </Label>
        </div> */}

        <Button
          type="submit"
          className="w-full py-5 bg-[#2f6836] cursor-pointer hover:bg-[#2f6836] text-white"
        >
          Login
        </Button>
      </form>

      {/* Bottom Section */}
      <div className="flex flex-col gap-4">
        {/* Divider */}
        <div className="flex items-center">
          <div className="flex-grow border-t border-gray-200" />
          <span className="mx-2 text-sm text-muted-foreground">OR</span>
          <div className="flex-grow border-t border-gray-200" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full py-5 text-sm border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Sign in with Google
        </Button>

        {/* Register Switch */}
        <p className="text-sm text-center text-muted-foreground">
          Don’t have an account?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="text-green-600 hover:underline"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
