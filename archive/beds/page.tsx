"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Bed, Stethoscope, Users, UserPlus, Package, BarChart, Settings, Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getNavigationLinks, type UserRole, getBeds } from "@/lib/data"

export default function BedsPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>("admin")
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const [filterWard, setFilterWard] = useState<string>("All")

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") as UserRole | null
    if (storedRole) {
      setCurrentRole(storedRole)
    } else {
      window.location.href = "/signin"
    }
  }, [])

  const allBeds = useMemo(() => getBeds(), [])
  const categories = useMemo(() => ["All", ...Array.from(new Set(allBeds.map(b => b.category)))], [allBeds])
  const wards = useMemo(() => ["All", ...Array.from(new Set(allBeds.map(b => b.ward)))], [allBeds])

  const filteredBeds = useMemo(() => {
    return allBeds.filter(bed =>
      (filterCategory === "All" || bed.category === filterCategory) &&
      (filterWard === "All" || bed.ward === filterWard)
    )
  }, [allBeds, filterCategory, filterWard])

  const navLinks = getNavigationLinks(currentRole || "admin")

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar for larger screens */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Stethoscope className="h-6 w-6" />
              <span className="">Ayurvedic HMS</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          {/* User profile and logout in sidebar */}
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                <AvatarFallback>{currentRole.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
                <div className="font-semibold capitalize">{currentRole}</div>
                <div className="text-xs text-muted-foreground">user@example.com</div>
              </div>
            </div>
            <Separator className="my-3" />
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary" onClick={() => { localStorage.removeItem("userRole"); window.location.href = "/signin"; }}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      {/* Main Content Area */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <h1 className="text-lg font-semibold md:text-2xl capitalize">Beds Management</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Category:</span>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">Ward:</span>
            <Select value={filterWard} onValueChange={setFilterWard}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Wards" />
              </SelectTrigger>
              <SelectContent>
                {wards.map(ward => (
                  <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">All Beds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bed ID</TableHead>
                      <TableHead>Bed Number</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Occupied</TableHead>
                      <TableHead>Patient UHID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBeds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No beds found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBeds.map((bed) => (
                        <TableRow key={bed.id}>
                          <TableCell className="font-mono">{bed.id}</TableCell>
                          <TableCell>{bed.bedNumber}</TableCell>
                          <TableCell>{bed.roomNumber}</TableCell>
                          <TableCell>{bed.ward}</TableCell>
                          <TableCell>{bed.category}</TableCell>
                          <TableCell>{bed.isOccupied ? "Yes" : "No"}</TableCell>
                          <TableCell>{bed.patientUhId || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
} 