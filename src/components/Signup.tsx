'use client';

import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3000/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      console.log("✅ Registration success:", response.data);
      // You can redirect or show success message here
    } catch (err: any) {
      console.error("❌ Registration failed:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <Input
          id="name"
          type="text"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          className="focus-visible:ring-green-600 py-5"
        />
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          className="focus-visible:ring-green-600 py-5"
        />
        <Input
          id="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="focus-visible:ring-green-600 py-5"
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-[#2f6836] cursor-pointer hover:bg-[#2f6836] text-white"
        >
          {loading ? "Registering..." : "Register"}
        </Button>
      </form>

      {/* Bottom Section */}
      <div className="flex flex-col gap-4">
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
          Sign up with Google
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="text-green-600 hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
