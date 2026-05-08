"use client";
import React, { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import api from '@/lib/api';


export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      await api.post('/register', formData);
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail === "Email already registered") {
        setError("This email is already registered. Please log in.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-indigo-900 text-center">Create Account</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

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
          Create Account
        </button>
        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline">Sign In</Link>
        </p>
      </form>
    </div>
  );
}