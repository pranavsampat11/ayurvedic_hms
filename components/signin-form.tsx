"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"

export function SignInForm() {
  const [staffId, setStaffId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    try {
      // Query Supabase for staff with matching id and password
      const { data, error: supaError } = await supabase
        .from("staff")
        .select("id, full_name, role")
        .eq("id", staffId)
        .eq("password", password)
        .single()
        
      if (supaError || !data) {
        setError("Invalid ID or password.")
        return
      }
        
      // Store user info in localStorage for session
      localStorage.setItem("userId", data.id)
      localStorage.setItem("userRole", data.role) // e.g., 'doctor', 'pharmacist', etc.
      localStorage.setItem("userName", data.full_name)
        
      // Route based on role
      if (data.role === "admin") {
        router.push("/admin/dashboard")
      } else if (data.role === "pharmacist") {
        router.push("/pharmacist/dashboard")
      } else if (data.role === "therapist") {
        router.push("/therapist/dashboard")
      } else if (data.role === "nurse") {
        router.push("/nurse/patients")
      } else if (data.role === "technician") {
        router.push("/technician/dashboard")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred during login. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="staffId">Staff ID</Label>
        <Input
          id="staffId"
          type="text"
          value={staffId}
          onChange={e => setStaffId(e.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  )
} 