"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LoaderOne } from "@/components/ui/loader"

interface Lesson {
  id: string
  title: string
  description: string
  completed: boolean
}

interface CourseDetail {
  id: string
  title: string
  description: string
  instructor: string
  totalLessons: number
}

export default function CourseDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [completionDate, setCompletionDate] = useState<Date | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (courseId && user) {
      fetchCourseDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, user])

  const fetchCourseDetails = async () => {
    try {
      const courseRef = doc(db, "courses", courseId)
      const courseSnap = await getDoc(courseRef)

      if (courseSnap.exists()) {
        setCourse({ id: courseSnap.id, ...courseSnap.data() } as CourseDetail)

        const lessonsRef = collection(db, "courses", courseId, "lessons")
        const lessonsSnapshot = await getDocs(lessonsRef)

        const lessonsData: Lesson[] = []
        for (const lessonDoc of lessonsSnapshot.docs) {
          // Check if user has completed this lesson
          let isCompleted = false
          if (user) {
            const progressRef = doc(db, "users", user.uid, "lessonProgress", `${courseId}_${lessonDoc.id}`)
            const progressSnap = await getDoc(progressRef)
            if (progressSnap.exists()) {
              isCompleted = progressSnap.data().completed || false
            }
          }

          lessonsData.push({
            id: lessonDoc.id,
            ...lessonDoc.data(),
            completed: isCompleted,
          } as Lesson)
        }

        setLessons(lessonsData)

        // Get enrollment data to check completion date
        if (user) {
          const enrollmentRef = doc(db, "users", user.uid, "enrollments", courseId)
          const enrollmentSnap = await getDoc(enrollmentRef)
          if (enrollmentSnap.exists()) {
            const enrollmentData = enrollmentSnap.data()
            if (enrollmentData.courseCompletedAt) {
              setCompletionDate(enrollmentData.courseCompletedAt.toDate())
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching course:", error)
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

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Course not found</p>
          <Link href="/courses">
            <Button>Back to Courses</Button>
          </Link>
        </div>
      </div>
    )
  }

  const completedLessons = lessons.filter((l) => l.completed).length
  const progress = (completedLessons / lessons.length) * 100
  const isAllCompleted = lessons.length > 0 && completedLessons === lessons.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-purple-200 dark:border-purple-800 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            SkillSync
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="hover:bg-purple-100 dark:hover:bg-purple-900/50">Back to Dashboard</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        {isAllCompleted && (
          <div className="mb-8 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-8 shadow-2xl border-4 border-green-400 animate-fade-in">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-4xl font-bold text-white mb-3">Congratulations!</h2>
              <p className="text-xl text-white/90 mb-2">You've completed this course!</p>
              <p className="text-lg text-white/80 mb-3">Amazing work on finishing all {lessons.length} lessons! 🌟</p>
              {completionDate && (
                <p className="text-md text-white/70">📅 Completed on: {completionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              )}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 dark:from-purple-400 dark:via-pink-400 dark:to-cyan-400 bg-clip-text text-transparent">{course.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">👨‍🏫 By {course.instructor}</p>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-purple-200 dark:border-purple-800 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Course Progress</h3>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {completedLessons}/{lessons.length} lessons
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className={`h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                isAllCompleted 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
            {Math.round(progress)}% complete {isAllCompleted && '✓'}
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Lessons</h2>
          {lessons.map((lesson, index) => (
            <Link key={lesson.id} href={`/courses/${courseId}/lessons/${lesson.id}`}>
              <div className="group bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-2xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      lesson.completed 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-br from-purple-500 to-pink-600'
                    }`}>
                      {lesson.completed ? '✓' : index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{lesson.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{lesson.description}</p>
                    </div>
                  </div>
                  <div className="text-3xl">{lesson.completed ? "🎯" : "📖"}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
