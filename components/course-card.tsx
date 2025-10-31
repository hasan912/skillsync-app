"use client"

import Link from "next/link"
import { useState } from "react"
import { db } from "@/lib/firebase"
import { doc, deleteDoc, collection, getDocs } from "firebase/firestore"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CourseCardProps {
  course: {
    id: string
    title: string
    description: string
    instructor: string
    totalLessons: number
    completedLessons: number
    completionDate?: Date
    isCompleted?: boolean
  }
  onUnenroll?: () => void
}

export default function CourseCard({ course, onUnenroll }: CourseCardProps) {
  const { user } = useAuth()
  const [isUnenrolling, setIsUnenrolling] = useState(false)
  const progress = (course.completedLessons / course.totalLessons) * 100
  
  // Determine gradient based on course ID hash
  const gradients = [
    { bg: 'from-purple-500 to-purple-600', progress: 'from-purple-400 to-purple-500', ring: 'ring-purple-500' },
    { bg: 'from-pink-500 to-pink-600', progress: 'from-pink-400 to-pink-500', ring: 'ring-pink-500' },
    { bg: 'from-cyan-500 to-cyan-600', progress: 'from-cyan-400 to-cyan-500', ring: 'ring-cyan-500' },
    { bg: 'from-indigo-500 to-indigo-600', progress: 'from-indigo-400 to-indigo-500', ring: 'ring-indigo-500' },
    { bg: 'from-rose-500 to-rose-600', progress: 'from-rose-400 to-rose-500', ring: 'ring-rose-500' },
    { bg: 'from-teal-500 to-teal-600', progress: 'from-teal-400 to-teal-500', ring: 'ring-teal-500' },
  ]
  
  const hashCode = course.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colorScheme = gradients[hashCode % gradients.length]

  const handleUnenroll = async () => {
    if (!user) return
    
    setIsUnenrolling(true)
    try {
      // Delete enrollment
      const enrollmentRef = doc(db, "users", user.uid, "enrollments", course.id)
      await deleteDoc(enrollmentRef)

      // Delete all lesson progress for this course
      const progressRef = collection(db, "users", user.uid, "lessonProgress")
      const progressSnapshot = await getDocs(progressRef)
      
      const deletePromises = progressSnapshot.docs
        .filter(doc => doc.id.startsWith(`${course.id}_`))
        .map(doc => deleteDoc(doc.ref))
      
      await Promise.all(deletePromises)

      // Call the callback to refresh the parent component
      if (onUnenroll) {
        onUnenroll()
      }
    } catch (error) {
      console.error("Error unenrolling from course:", error)
      alert("Failed to unenroll from course. Please try again.")
    } finally {
      setIsUnenrolling(false)
    }
  }

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform h-full border border-purple-200 dark:border-purple-800 relative">
      <Link href={`/courses/${course.id}`} className="block">
        <div className={`h-24 bg-gradient-to-br ${colorScheme.bg} dark:${colorScheme.bg} flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors"></div>
          <div className="text-4xl group-hover:scale-110 transition-transform relative z-10">
            {progress === 100 ? '🎉' : progress > 50 ? '📖' : '🚀'}
          </div>
        </div>
      </Link>
        
      <div className="p-6">
        <Link href={`/courses/${course.id}`}>
          <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
            {course.title}
          </h3>
        </Link>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{course.description}</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4 flex items-center gap-1">
          <span>👨‍🏫</span> {course.instructor}
        </p>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {course.completedLessons}/{course.totalLessons}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className={`bg-gradient-to-r ${colorScheme.progress} h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {Math.round(progress)}% complete
            </p>
            {progress === 100 && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full font-semibold">
                ✓ Completed
              </span>
            )}
          </div>
          {course.completionDate && progress === 100 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span>📅</span>
              <span>Completed: {course.completionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Link href={`/courses/${course.id}`} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              Continue Learning
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                disabled={isUnenrolling}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unenroll from Course?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to unenroll from <strong>{course.title}</strong>? 
                  This will delete all your progress in this course. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleUnenroll}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isUnenrolling ? "Unenrolling..." : "Unenroll"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
