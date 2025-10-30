"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { LoaderOne } from "@/components/ui/loader"
import Footer from "@/components/Footer"

interface AnalyticsData {
  totalLessonsCompleted: number
  totalCoursesEnrolled: number
  averageCompletionRate: number
  weeklyData: Array<{ day: string; completed: number }>
  monthlyData: Array<{ week: string; completed: number }>
  courseProgress: Array<{ name: string; completed: number; total: number }>
  categoryData: Array<{ name: string; value: number; color: string }>
}

export default function AnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchAnalytics = async () => {
    try {
      const enrollmentsRef = collection(db, "users", user!.uid, "enrollments")
      const enrollmentsSnapshot = await getDocs(enrollmentsRef)

      let totalLessonsCompleted = 0
      const courseProgress = []

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollment = enrollmentDoc.data()
        totalLessonsCompleted += enrollment.completedLessons || 0
        courseProgress.push({
          name: enrollment.courseTitle,
          completed: enrollment.completedLessons || 0,
          total: enrollment.totalLessons,
        })
      }

      // Fetch actual lesson progress data
      const progressRef = collection(db, "users", user!.uid, "lessonProgress")
      const progressSnapshot = await getDocs(progressRef)

      // Initialize weekly data (last 7 days)
      const weeklyData = [
        { day: "Mon", completed: 0 },
        { day: "Tue", completed: 0 },
        { day: "Wed", completed: 0 },
        { day: "Thu", completed: 0 },
        { day: "Fri", completed: 0 },
        { day: "Sat", completed: 0 },
        { day: "Sun", completed: 0 },
      ]

      // Initialize monthly data (last 4 weeks)
      const monthlyData = [
        { week: "Week 1", completed: 0 },
        { week: "Week 2", completed: 0 },
        { week: "Week 3", completed: 0 },
        { week: "Week 4", completed: 0 },
      ]

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
      
      // Calculate the start of this week (Monday)
      const startOfWeek = new Date(today)
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1
      startOfWeek.setDate(today.getDate() - daysToMonday)

      // Calculate the start of this month (4 weeks ago)
      const startOfMonth = new Date(startOfWeek)
      startOfMonth.setDate(startOfWeek.getDate() - 21) // 3 weeks back

      // Process each completed lesson
      progressSnapshot.docs.forEach((doc) => {
        const progress = doc.data()
        if (progress.completed && progress.completedAt) {
          const completedDate = progress.completedAt.toDate()
          const completedDay = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate())

          // Check if within current week
          if (completedDay >= startOfWeek && completedDay <= today) {
            const dayIndex = completedDay.getDay()
            const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1 // Map Sunday to 6, Monday to 0
            weeklyData[mappedIndex].completed++
          }

          // Check if within last 4 weeks
          if (completedDay >= startOfMonth && completedDay <= today) {
            const daysDiff = Math.floor((completedDay.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24))
            const weekIndex = Math.floor(daysDiff / 7)
            if (weekIndex >= 0 && weekIndex < 4) {
              monthlyData[weekIndex].completed++
            }
          }
        }
      })

      const categoryData = courseProgress.map((course, index) => ({
        name: course.name,
        value: course.completed,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      }))

      const totalPossible = courseProgress.reduce((sum, c) => sum + c.total, 0)
      const averageCompletionRate = totalPossible > 0 ? (totalLessonsCompleted / totalPossible) * 100 : 0

      setAnalytics({
        totalLessonsCompleted,
        totalCoursesEnrolled: enrollmentsSnapshot.size,
        averageCompletionRate,
        weeklyData,
        monthlyData,
        courseProgress,
        categoryData,
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setPageLoading(false)
    }
  }

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderOne/>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  // Custom Tooltip Component for better dark mode support
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-foreground">
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            SkillSync
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Learning Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Total Lessons Completed</p>
            <p className="text-4xl font-bold">{analytics.totalLessonsCompleted}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Courses Enrolled</p>
            <p className="text-4xl font-bold">{analytics.totalCoursesEnrolled}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Completion Rate</p>
            <p className="text-4xl font-bold">{analytics.averageCompletionRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Weekly Activity</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completed" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Monthly Summary</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Course Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Course Progress</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.courseProgress} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completed" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
