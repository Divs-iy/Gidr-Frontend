"use client";
import React, { useState } from 'react';
import axios from 'axios';
// import { Link } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function LoginPage() {   {/* ✅ No props — Next.js pages don't receive them */}
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      const res = await api.post('/login', formData);
      // ✅ Save token and name directly here — no prop needed
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('userName', res.data.user_name);

      // ✅ Redirect after saving
      window.location.href = '/upload';
    } catch (err) {
      setError("Invalid email or password. Try again!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-indigo-900 text-center">Gidr Login</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
        >
          Sign In
        </button>
        {/* ADD this just before the closing </form> tag */}
        <p className="text-center text-sm text-slate-500 mt-4">
          Don't have an account?{" "}
          <Link href="/register" className="text-indigo-600 hover:underline">Create one</Link>
        </p>
      </form>
    </div>
  );
}