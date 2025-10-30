"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Book, BookOpen } from "lucide-react"
import { LoaderOne } from "@/components/ui/loader"
import Footer from "@/components/Footer"

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  totalLessons: number
}

interface Lesson {
  id: string
  title: string
  description: string
  content: string
}

export default function CreateCoursePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const [courses, setCourses] = useState<Course[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingLesson, setEditingLesson] = useState<{ courseId: string; lesson: Lesson | null } | null>(null)
  const [lessons, setLessons] = useState<{ [key: string]: Lesson[] }>({})

  // Course form state
  const [courseTitle, setCourseTitle] = useState("")
  const [courseDescription, setCourseDescription] = useState("")
  const [courseInstructor, setCourseInstructor] = useState("")

  // Lesson form state
  const [lessonTitle, setLessonTitle] = useState("")
  const [lessonDescription, setLessonDescription] = useState("")
  const [lessonContent, setLessonContent] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
      } else if (!isAdmin) {
        router.push("/dashboard")
      }
    }
  }, [user, loading, router, isAdmin])

  useEffect(() => {
    fetchCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCourses = async () => {
    try {
      const coursesRef = collection(db, "courses")
      const coursesSnapshot = await getDocs(coursesRef)

      const coursesData: Course[] = []
      for (const docSnap of coursesSnapshot.docs) {
        coursesData.push({ id: docSnap.id, ...docSnap.data() } as Course)
      }

      setCourses(coursesData)
      setPageLoading(false)
    } catch (error) {
      console.error("Error fetching courses:", error)
      setPageLoading(false)
    }
  }

  const fetchLessons = async (courseId: string) => {
    try {
      const lessonsRef = collection(db, "courses", courseId, "lessons")
      const lessonsSnapshot = await getDocs(lessonsRef)

      const lessonsData: Lesson[] = []
      for (const lessonDoc of lessonsSnapshot.docs) {
        lessonsData.push({ id: lessonDoc.id, ...lessonDoc.data() } as Lesson)
      }

      setLessons((prev) => ({ ...prev, [courseId]: lessonsData }))
    } catch (error) {
      console.error("Error fetching lessons:", error)
    }
  }

  const handleCreateCourse = async () => {
    try {
      const newCourse = {
        title: courseTitle,
        description: courseDescription,
        instructor: courseInstructor,
        totalLessons: 0,
      }

      await addDoc(collection(db, "courses"), newCourse)
      await fetchCourses()
      resetCourseForm()
      setCourseDialogOpen(false)
    } catch (error) {
      console.error("Error creating course:", error)
    }
  }

  const handleUpdateCourse = async () => {
    if (!editingCourse) return

    try {
      const courseRef = doc(db, "courses", editingCourse.id)
      await updateDoc(courseRef, {
        title: courseTitle,
        description: courseDescription,
        instructor: courseInstructor,
      })

      await fetchCourses()
      resetCourseForm()
      setCourseDialogOpen(false)
    } catch (error) {
      console.error("Error updating course:", error)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return

    try {
      // Delete all lessons
      if (lessons[courseId]) {
        for (const lesson of lessons[courseId]) {
          await deleteDoc(doc(db, "courses", courseId, "lessons", lesson.id))
        }
      }

      // Delete course
      await deleteDoc(doc(db, "courses", courseId))
      await fetchCourses()
    } catch (error) {
      console.error("Error deleting course:", error)
    }
  }

  const handleCreateLesson = async () => {
    if (!selectedCourseId) return

    try {
      const newLesson = {
        title: lessonTitle,
        description: lessonDescription,
        content: lessonContent,
      }

      const lessonsCount = lessons[selectedCourseId]?.length || 0
      const lessonRef = doc(db, "courses", selectedCourseId, "lessons", `lesson-${lessonsCount + 1}`)
      await setDoc(lessonRef, newLesson)

      // Update course totalLessons
      const courseRef = doc(db, "courses", selectedCourseId)
      const currentCourse = courses.find((c) => c.id === selectedCourseId)
      await updateDoc(courseRef, {
        totalLessons: (currentCourse?.totalLessons || 0) + 1,
      })

      await fetchLessons(selectedCourseId)
      await fetchCourses()
      resetLessonForm()
      setLessonDialogOpen(false)
    } catch (error) {
      console.error("Error creating lesson:", error)
    }
  }

  const handleUpdateLesson = async () => {
    if (!editingLesson) return

    try {
      const lessonRef = doc(db, "courses", editingLesson.courseId, "lessons", editingLesson.lesson!.id)
      await updateDoc(lessonRef, {
        title: lessonTitle,
        description: lessonDescription,
        content: lessonContent,
      })

      await fetchLessons(editingLesson.courseId)
      resetLessonForm()
      setLessonDialogOpen(false)
    } catch (error) {
      console.error("Error updating lesson:", error)
    }
  }

  const handleDeleteLesson = async (courseId: string, lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return

    try {
      await deleteDoc(doc(db, "courses", courseId, "lessons", lessonId))

      // Update course totalLessons
      const courseRef = doc(db, "courses", courseId)
      const currentCourse = courses.find((c) => c.id === courseId)
      await updateDoc(courseRef, {
        totalLessons: Math.max(0, (currentCourse?.totalLessons || 0) - 1),
      })

      await fetchLessons(courseId)
      await fetchCourses()
    } catch (error) {
      console.error("Error deleting lesson:", error)
    }
  }

  const resetCourseForm = () => {
    setCourseTitle("")
    setCourseDescription("")
    setCourseInstructor("")
    setEditingCourse(null)
  }

  const resetLessonForm = () => {
    setLessonTitle("")
    setLessonDescription("")
    setLessonContent("")
    setSelectedCourseId("")
    setEditingLesson(null)
  }

  const openCourseDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      setCourseTitle(course.title)
      setCourseDescription(course.description)
      setCourseInstructor(course.instructor)
    } else {
      resetCourseForm()
    }
    setCourseDialogOpen(true)
  }

  const openLessonDialog = (courseId: string, lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson({ courseId, lesson })
      setLessonTitle(lesson.title)
      setLessonDescription(lesson.description)
      setLessonContent(lesson.content)
    } else {
      resetLessonForm()
      setSelectedCourseId(courseId)
    }
    setLessonDialogOpen(true)
  }

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderOne/>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-primary flex items-center gap-2">
            <Book className="w-8 h-8" />
            SkillSync Admin
          </Link>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Back to Dashboard</Button>
            </Link>
            <Link href="/courses">
              <Button variant="ghost">Browse Courses</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Course Management</h1>
            <p className="text-muted-foreground">Create and manage your courses and lessons</p>
          </div>
          <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openCourseDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Course Title</label>
                  <Input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g., React Fundamentals"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="Describe your course..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Instructor Name</label>
                  <Input
                    type="text"
                    value={courseInstructor}
                    onChange={(e) => setCourseInstructor(e.target.value)}
                    placeholder="e.g., John Doe"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}>
                  {editingCourse ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-8">
          {courses.map((course) => (
            <div key={course.id} className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">{course.title}</h3>
                  <p className="text-muted-foreground mb-2">{course.description}</p>
                  <p className="text-sm text-muted-foreground">By {course.instructor}</p>
                  <p className="text-sm text-muted-foreground">{course.totalLessons} lessons</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openCourseDialog(course)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteCourse(course.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fetchLessons(course.id)
                      openLessonDialog(course.id)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    if (!lessons[course.id]) {
                      fetchLessons(course.id)
                    }
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline mb-4"
                >
                  {lessons[course.id] ? <BookOpen className="w-4 h-4" /> : <Book className="w-4 h-4" />}
                  {lessons[course.id] ? "Hide Lessons" : "Show Lessons"}
                </button>

                {lessons[course.id] && (
                  <div className="space-y-3">
                    {lessons[course.id].map((lesson) => (
                      <div key={lesson.id} className="bg-secondary border border-border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{lesson.title}</h4>
                          <p className="text-sm text-muted-foreground">{lesson.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openLessonDialog(course.id, lesson)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteLesson(course.id, lesson.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {lessons[course.id].length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No lessons yet. Add one above!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Edit Lesson" : "Create New Lesson"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lesson Title</label>
              <Input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g., Introduction to React"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                type="text"
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="Brief description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                value={lessonContent}
                onChange={(e) => setLessonContent(e.target.value)}
                placeholder="Lesson content goes here..."
                rows={10}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}>
              {editingLesson ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  )
}

