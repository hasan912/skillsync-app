"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LoaderOne } from "@/components/ui/loader"

interface Lesson {
  id: string
  title: string
  description: string
  content: string
}

export default function LessonPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [completed, setCompleted] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)
  const [totalLessons, setTotalLessons] = useState(0)
  const [completedLessons, setCompletedLessons] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (courseId && lessonId) {
      fetchLesson()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId])

  const fetchLesson = async () => {
    try {
      const lessonRef = doc(db, "courses", courseId, "lessons", lessonId)
      const lessonSnap = await getDoc(lessonRef)

      if (lessonSnap.exists()) {
        setLesson({ id: lessonSnap.id, ...lessonSnap.data() } as Lesson)

        const progressRef = doc(db, "users", user!.uid, "lessonProgress", `${courseId}_${lessonId}`)
        const progressSnap = await getDoc(progressRef)
        if (progressSnap.exists()) {
          setCompleted(progressSnap.data().completed)
        }

        // Get total lessons count
        const lessonsRef = collection(db, "courses", courseId, "lessons")
        const lessonsSnapshot = await getDocs(lessonsRef)
        setTotalLessons(lessonsSnapshot.size)

        // Get enrollment to check completed lessons
        const enrollmentRef = doc(db, "users", user!.uid, "enrollments", courseId)
        const enrollmentSnap = await getDoc(enrollmentRef)
        if (enrollmentSnap.exists()) {
          setCompletedLessons(enrollmentSnap.data().completedLessons || 0)
        }
      }
    } catch (error) {
      console.error("Error fetching lesson:", error)
    } finally {
      setPageLoading(false)
    }
  }

  const handleToggleComplete = async () => {
    if (!user) return

    setUpdating(true)
    try {
      const progressRef = doc(db, "users", user.uid, "lessonProgress", `${courseId}_${lessonId}`)
      await setDoc(progressRef, {
        courseId,
        lessonId,
        completed: !completed,
        completedAt: new Date(),
      })

      const enrollmentRef = doc(db, "users", user.uid, "enrollments", courseId)
      const enrollmentSnap = await getDoc(enrollmentRef)
      if (enrollmentSnap.exists()) {
        const currentCompleted = enrollmentSnap.data().completedLessons || 0
        const newCompletedCount = !completed ? currentCompleted + 1 : Math.max(0, currentCompleted - 1)
        
        const updateData: any = {
          completedLessons: newCompletedCount,
        }

        // Check if this completes the course
        if (!completed && newCompletedCount === totalLessons) {
          updateData.courseCompletedAt = new Date()
          updateData.isCompleted = true
          setShowCongrats(true)
        } else if (completed && newCompletedCount < totalLessons) {
          // If uncompleting a lesson, remove completion status
          updateData.courseCompletedAt = null
          updateData.isCompleted = false
        }

        await updateDoc(enrollmentRef, updateData)
        setCompletedLessons(newCompletedCount)
      }

      setCompleted(!completed)
    } catch (error) {
      console.error("Error updating lesson:", error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
       <LoaderOne/>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Lesson not found</p>
          <Link href={`/courses/${courseId}`}>
            <Button>Back to Course</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      {/* Congratulations Modal */}
      {showCongrats && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-green-400 animate-scale-in">
            <div className="text-center">
              <div className="text-8xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-4xl font-bold text-white mb-3">Congratulations!</h2>
              <p className="text-xl text-white/90 mb-2">You've completed this course!</p>
              <p className="text-lg text-white/80 mb-6">Amazing work on finishing all {totalLessons} lessons! 🌟</p>
              <div className="flex gap-3 justify-center">
                <Link href={`/courses/${courseId}`}>
                  <Button className="bg-white text-green-600 hover:bg-gray-100 font-bold">
                    View Course
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="bg-white/20 text-white hover:bg-white/30 font-bold border-2 border-white">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-purple-200 dark:border-purple-800 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            SkillSync
          </Link>
          <Link href={`/courses/${courseId}`}>
            <Button variant="ghost" className="hover:bg-purple-100 dark:hover:bg-purple-900/50">Back to Course</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 dark:from-purple-400 dark:via-pink-400 dark:to-cyan-400 bg-clip-text text-transparent">{lesson.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{lesson.description}</p>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-purple-200 dark:border-purple-800 rounded-2xl p-8 mb-8 shadow-xl">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{lesson.content}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            onClick={handleToggleComplete}
            disabled={updating}
            className={completed 
              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg" 
              : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            }
            size="lg"
          >
            {updating ? "Updating..." : completed ? "✓ Completed" : "Mark as Complete"}
          </Button>
          <Link href={`/courses/${courseId}`}>
            <Button variant="outline" size="lg" className="border-2 border-purple-500 text-purple-600 hover:bg-purple-100 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/50">
              Back to Course
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
