"use client"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useAuth } from "@/lib/auth-context"

export default function Navbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-purple-200 dark:border-purple-800 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          SkillSync
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex gap-2 items-center">
          <Link href="/dashboard">
            <Button variant="ghost" className="hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-700 dark:hover:text-purple-300">Dashboard</Button>
          </Link>

          {isAdmin && (
            <Link href="/dashboard/create-course">
              <Button variant="outline" className="border-pink-500 text-pink-600 hover:bg-pink-100 dark:border-pink-400 dark:text-pink-400 dark:hover:bg-pink-900/50">Manage Courses</Button>
            </Link>
          )}

          <Link href="/dashboard/analytics">
            <Button variant="ghost" className="hover:bg-cyan-100 dark:hover:bg-cyan-900/50 hover:text-cyan-700 dark:hover:text-cyan-300">Analytics</Button>
          </Link>

          <ThemeSwitcher />
        </div>

        {/* Mobile hamburger */}
        <div className="sm:hidden flex items-center gap-2 relative">
          <ThemeSwitcher />
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((s) => !s)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {open ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-lg shadow-lg p-3 border border-purple-200 dark:border-purple-800 z-50">
              <div className="flex flex-col gap-2">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                </Link>

                {isAdmin && (
                  <Link href="/dashboard/create-course" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">Manage Courses</Button>
                  </Link>
                )}

                <Link href="/dashboard/analytics" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Analytics</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}