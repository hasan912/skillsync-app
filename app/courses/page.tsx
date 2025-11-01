"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, setDoc } from "firebase/firestore"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LoaderOne } from "@/components/ui/loader"
import { ThemeSwitcher } from "@/components/theme-switcher"
import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  totalLessons: number
  enrolled?: boolean
  isCompleted?: boolean
  completionDate?: Date
}

export default function CoursesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [courseLoading, setCourseLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchCourses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchCourses = async () => {
    try {
      const coursesRef = collection(db, "courses")
      const coursesSnapshot = await getDocs(coursesRef)

      const coursesData: Course[] = []
      for (const doc of coursesSnapshot.docs) {
        const courseData = {
          id: doc.id,
          ...doc.data(),
        } as Course

        // Check if user has enrolled and completed this course
        if (user) {
          const enrollmentRef = collection(db, "users", user.uid, "enrollments")
          const enrollmentSnap = await getDocs(enrollmentRef)
          
          enrollmentSnap.docs.forEach((enrollDoc) => {
            if (enrollDoc.id === doc.id) {
              courseData.enrolled = true
              courseData.isCompleted = enrollDoc.data().isCompleted || false
              if (enrollDoc.data().courseCompletedAt) {
                courseData.completionDate = enrollDoc.data().courseCompletedAt.toDate()
              }
            }
          })
        }

        coursesData.push(courseData)
      }

      setCourses(coursesData)
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setCourseLoading(false)
    }
  }

  const handleEnroll = async (courseId: string, course: Course) => {
    if (!user) return

    setEnrolling(courseId)
    try {
      const enrollmentRef = doc(db, "users", user.uid, "enrollments", courseId)
      await setDoc(enrollmentRef, {
        courseId,
        courseTitle: course.title,
        courseDescription: course.description,
        instructor: course.instructor,
        totalLessons: course.totalLessons,
        completedLessons: 0,
        enrolledAt: new Date(),
      })
      
      setCourses(courses.map((c) => (c.id === courseId ? { ...c, enrolled: true } : c)))
    } catch (error) {
      console.error("Error enrolling in course:", error)
    } finally {
      setEnrolling(null)
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
      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 dark:from-purple-400 dark:via-pink-400 dark:to-cyan-400 bg-clip-text text-transparent px-2">
            Available Courses
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 px-2">Explore and enroll in courses to start learning 🎓</p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-3xl p-12 shadow-xl border border-purple-200 dark:border-purple-800">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">No courses available at the moment.</p>
            <Button 
              onClick={fetchCourses} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg font-semibold rounded-xl"
            >
              Refresh
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {courses.map((course, index) => {
              const gradients = [
                'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
                'from-pink-500 to-pink-600 dark:from-pink-600 dark:to-pink-700',
                'from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700',
                'from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700',
                'from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700',
                'from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700',
              ]
              const gradient = gradients[index % gradients.length]
              
              return (
                <div
                  key={course.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 transform border border-purple-200 dark:border-purple-800"
                >
                  <div className={`h-24 sm:h-32 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <div className="text-4xl sm:text-6xl group-hover:scale-110 transition-transform">
                      {index % 6 === 0 ? '📚' : index % 6 === 1 ? '💻' : index % 6 === 2 ? '🎨' : index % 6 === 3 ? '🔬' : index % 6 === 4 ? '🎵' : '🌟'}
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">{course.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex justify-between items-center mb-3 sm:mb-4 text-xs sm:text-sm">
                      <span className="text-gray-500 dark:text-gray-400 truncate mr-2">👨‍🏫 {course.instructor}</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">📖 {course.totalLessons} lessons</span>
                    </div>
                    {course.isCompleted ? (
                      <div className="space-y-2">
                        <div className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg rounded-xl font-semibold py-2.5 sm:py-3 text-sm sm:text-base text-center">
                          ✓ Completed
                        </div>
                        {course.completionDate && (
                          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            📅 {course.completionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    ) : course.enrolled ? (
                      <Link href={`/courses/${course.id}`}>
                        <Button
                          className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold"
                        >
                          Continue Learning
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        onClick={() => handleEnroll(course.id, course)}
                        disabled={enrolling === course.id || course.enrolled}
                        className={`w-full py-2.5 sm:py-3 text-sm sm:text-base ${
                          course.enrolled 
                            ? 'bg-blue-500 hover:bg-blue-600' 
                            : `bg-gradient-to-r ${gradient} hover:opacity-90`
                        } text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold`}
                      >
                        {course.enrolled ? "Continue Learning" : enrolling === course.id ? "Enrolling..." : "Enroll Now"}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
