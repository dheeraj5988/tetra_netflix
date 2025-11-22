"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Download, CheckCircle, AlertCircle, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function Home() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: "code" | "link"; data: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Basic email validation
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    // Validate email
    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/fetch-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch code or link")
      }

      if (data?.success && data.type === "code") {
        setResult({ type: "code", data: data.code })
      } else if (data?.success && data.type === "link") {
        setResult({ type: "link", data: data.link })
      } else {
        throw new Error(data?.message || "No code or link found")
      }
    } catch (err) {
      setError(String(err).replace("Error: ", ""))
    } finally {
      setLoading(false)
    }
  }

  const handleApproveLink = () => {
    if (result?.type === "link") {
      window.open(result.data, "_blank")
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
            <h1 className="text-3xl font-bold text-gray-900">Netflix Code & Household Updater</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Enter your email to fetch verification codes or household location update links.
            </p>
          </div>

          {/* Instructions Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-700">How it works</p>
              <p className="text-blue-600 text-sm">We search your emails for Netflix codes and household update links</p>
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
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  disabled={loading}
                  className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Searching...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Fetch Now
                </span>
              )}
            </Button>
          </form>

          {/* Result: Code Display */}
          {result?.type === "code" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center space-y-3">
              <div className="flex justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm font-medium text-green-700">Netflix Verification Code Found</p>
              <div className="bg-white border-2 border-green-600 rounded-lg p-4">
                <p className="text-5xl font-bold text-green-600 tracking-widest">{result.data}</p>
              </div>
              <p className="text-xs text-green-600">Code will expire in 15 minutes. Enter it on your Netflix device.</p>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(result.data)
                  alert("Code copied to clipboard!")
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2"
              >
                Copy Code
              </Button>
            </div>
          )}

          {/* Result: Link Display */}
          {result?.type === "link" && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center space-y-3">
              <div className="flex justify-center">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-purple-700">Household Location Update Link Found</p>
              <p className="text-xs text-purple-600 break-all">{result.data}</p>
              <Button
                onClick={handleApproveLink}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 font-semibold"
              >
                ��� Approve Update
              </Button>
              <p className="text-xs text-purple-600">This will open the Netflix verification link in a new tab.</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center space-y-1 pt-2">
            <div className="flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
            </div>
            <p className="text-xs font-medium text-gray-600">Secure Netflix code retrieval service</p>
            <p className="text-xs text-gray-500">Your emails are fetched securely via Gmail API</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
