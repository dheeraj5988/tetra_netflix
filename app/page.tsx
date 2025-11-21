"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function Home() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/fetch-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Request failed")
      // show success (replace with nicer UI as needed)
      alert(data.message || `Code sent to ${email}`)
    } catch (err) {
      alert(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <div className="p-8 space-y-6">
          {/* Header Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <Mail className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-red-600 rounded-full" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Fetch Netflix Household / Travel Code</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Send the code from your TV first. Then enter your email. It may take up to 60 seconds.
            </p>
          </div>

          {/* Step 1 Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <Download className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Step 1</p>
              <p className="text-red-600 text-sm">Send the code from your TV first</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleFetch} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Fetching...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Fetch Now
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center space-y-1 pt-2">
            <div className="flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
            </div>
            <p className="text-xs font-medium text-gray-600">Secure Netflix code retrieval service</p>
            <p className="text-xs text-gray-500">Codes are automatically retrieved from verified Netflix emails</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
