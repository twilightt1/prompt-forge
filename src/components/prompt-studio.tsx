"use client";
import React, { useState } from "react";
export function PromptStudio() {
  const [input, setInput] = useState("Write a landing page.");
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">PromptForge</h1>
        <textarea value={input} onChange={e => setInput(e.target.value)} className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded p-2" />
      </div>
    </main>
  );
}