"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import CourseCard from "@/components/course-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoaderFive, LoaderOne } from "@/components/ui/loader"
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Footer from "@/components/Footer"
interface Course {
  id: string
  title: string
  description: string
  instructor: string
  totalLessons: number
  completedLessons: number
  completionDate?: Date
  isCompleted?: boolean
}

interface UserProfile {
  name?: string
  email?: string
  avatar?: string
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [courseLoading, setCourseLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  const words = [
    {
      text: "Welcome",
        
    },
    {
      text: "Back,",
    },
    {
      text: userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "Learner",
      className: "text-blue-500 dark:text-blue-500",
    },
  ]

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchUserProfile()
      fetchEnrolledCourses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const userRef = doc(db, "users", user!.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        setUserProfile(userSnap.data() as UserProfile)
      } else {
        // Use Firebase auth data if profile doesn't exist
        setUserProfile({
          name: user?.displayName || undefined,
          email: user?.email || undefined,
          avatar: user?.photoURL || undefined,
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const fetchEnrolledCourses = async () => {
    try {
      const enrollmentsRef = collection(db, "users", user!.uid, "enrollments")
      const enrollmentsSnapshot = await getDocs(enrollmentsRef)

      const courses: Course[] = []
      for (const doc of enrollmentsSnapshot.docs) {
        const enrollment = doc.data()
        courses.push({
          id: enrollment.courseId,
          title: enrollment.courseTitle,
          description: enrollment.courseDescription,
          instructor: enrollment.instructor,
          totalLessons: enrollment.totalLessons,
          completedLessons: enrollment.completedLessons || 0,
          completionDate: enrollment.courseCompletedAt?.toDate(),
          isCompleted: enrollment.isCompleted || false,
        })
      }

      setEnrolledCourses(courses)
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setCourseLoading(false)
    }
  }

  if (loading || courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderOne/>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-purple-200 dark:border-purple-800 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            SkillSync
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-2 items-center">
            <Link href="/courses">
              <Button variant="ghost" className="hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-700 dark:hover:text-purple-300">Browse Courses</Button>
            </Link>
            {isAdmin && (
              <Link href="/dashboard/create-course">
                <Button variant="ghost" className="hover:bg-pink-100 dark:hover:bg-pink-900/50 hover:text-pink-700 dark:hover:text-pink-300">Manage Courses</Button>
              </Link>
            )}
            <Link href="/dashboard/analytics">
              <Button variant="ghost" className="hover:bg-cyan-100 dark:hover:bg-cyan-900/50 hover:text-cyan-700 dark:hover:text-cyan-300">Analytics</Button>
            </Link>
            <Link href="/dashboard/profile">
              <Button variant="ghost" className="hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-700 dark:hover:text-purple-300">Profile</Button>
            </Link>
            <ThemeSwitcher />
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden gap-2 items-center">
            <ThemeSwitcher />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-purple-100 dark:hover:bg-purple-900/50">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white dark:bg-gray-900">
                <SheetHeader>
                  <SheetTitle className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  <Link href="/courses">
                    <Button variant="ghost" className="w-full justify-start hover:bg-purple-100 dark:hover:bg-purple-900/50">
                      Browse Courses
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link href="/dashboard/create-course">
                      <Button variant="ghost" className="w-full justify-start hover:bg-pink-100 dark:hover:bg-pink-900/50">
                        Manage Courses
                      </Button>
                    </Link>
                  )}
                  <Link href="/dashboard/analytics">
                    <Button variant="ghost" className="w-full justify-start hover:bg-cyan-100 dark:hover:bg-cyan-900/50">
                      Analytics
                    </Button>
                  </Link>
                  <Link href="/dashboard/profile">
                    <Button variant="ghost" className="w-full justify-start hover:bg-purple-100 dark:hover:bg-purple-900/50">
                      Profile
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-6 mb-4">
            <Avatar className="w-20 h-20 ring-4 ring-purple-500 ring-offset-4 ring-offset-white dark:ring-offset-gray-800">
              <AvatarImage src={userProfile?.avatar || user?.photoURL || ""} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {(userProfile?.name || user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <TypewriterEffectSmooth words={words}  />
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">Continue your learning journey 🚀</p>
            </div>
          </div>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 backdrop-blur-lg rounded-3xl p-12 text-center shadow-xl border border-purple-200 dark:border-purple-800">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">You haven't enrolled in any courses yet.</p>
            <Link href="/courses">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg font-semibold rounded-xl">
                Browse Courses
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
