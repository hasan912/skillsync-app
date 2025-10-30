import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, doc, setDoc, getDocs, deleteDoc, writeBatch } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDTEQ_gsC-ci1NcMvySUIYNebgw5VjL38Q",
  authDomain: "skillsync-fa20e.firebaseapp.com",
  projectId: "skillsync-fa20e",
  storageBucket: "skillsync-fa20e.firebasestorage.app",
  messagingSenderId: "208013345475",
  appId: "1:208013345475:web:594cf3b38783d6b06e1876",
  measurementId: "G-1GX70KP2QM",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const courses = [
  {
    title: "React Fundamentals",
    description: "Learn the basics of React and build interactive UIs",
    instructor: "Sarah Chen",
    totalLessons: 12,
  },
  {
    title: "Next.js Mastery",
    description: "Master Next.js for full-stack development",
    instructor: "John Smith",
    totalLessons: 15,
  },
  {
    title: "TypeScript Essentials",
    description: "Write type-safe JavaScript with TypeScript",
    instructor: "Mike Johnson",
    totalLessons: 10,
  },
  {
    title: "Web Design Principles",
    description: "Create beautiful and user-friendly web interfaces",
    instructor: "Emma Davis",
    totalLessons: 8,
  },
]

function generateLessons(courseTitle: string, totalLessons: number) {
  const lessons = []
  const lessonTemplates = {
    "React Fundamentals": [
      "Introduction to React",
      "Components and JSX",
      "State and Props",
      "Event Handling",
      "Conditional Rendering",
      "Lists and Keys",
      "React Hooks Basics",
      "useState Hook",
      "useEffect Hook",
      "Custom Hooks",
      "Context API",
      "Project: To-Do App",
    ],
    "Next.js Mastery": [
      "Introduction to Next.js",
      "Project Setup",
      "Pages and Routing",
      "Server Components",
      "Client Components",
      "Data Fetching",
      "API Routes",
      "Authentication",
      "Database Integration",
      "Styling with Tailwind",
      "Deployment",
      "Advanced Routing",
      "Middleware",
      "Image Optimization",
      "Performance Optimization",
    ],
    "TypeScript Essentials": [
      "Why TypeScript?",
      "Basic Types",
      "Functions",
      "Interfaces",
      "Classes",
      "Generics",
      "Advanced Types",
      "Modules",
      "Decorators",
      "Type Guards",
    ],
    "Web Design Principles": [
      "Design Fundamentals",
      "Color Theory",
      "Typography",
      "Layout Principles",
      "Visual Hierarchy",
      "User Experience (UX)",
      "Accessibility",
      "Responsive Design",
    ],
  }

  const templates = lessonTemplates[courseTitle as keyof typeof lessonTemplates] || [
    "Introduction",
    "Core Concepts",
    "Practical Examples",
    "Advanced Topics",
  ]

  for (let i = 0; i < totalLessons; i++) {
    const lessonNum = i + 1
    const title = templates[i] || `Lesson ${lessonNum}`
    lessons.push({
      title,
      description: `Complete lesson ${lessonNum} of this course`,
      content: `Welcome to ${title}. In this lesson, we will explore key concepts and practical examples related to ${courseTitle}.`,
    })
  }

  return lessons
}

async function seedDatabase() {
  try {
    console.log("Starting to seed database...")

    // First, clear existing courses
    console.log("Clearing existing courses...")
    const coursesSnapshot = await getDocs(collection(db, "courses"))
    for (const docSnapshot of coursesSnapshot.docs) {
      const courseId = docSnapshot.id
      // Delete all lessons for this course
      const lessonsSnapshot = await getDocs(collection(db, "courses", courseId, "lessons"))
      for (const lessonDoc of lessonsSnapshot.docs) {
        await deleteDoc(doc(db, "courses", courseId, "lessons", lessonDoc.id))
      }
      // Delete the course
      await deleteDoc(doc(db, "courses", courseId))
    }
    console.log("Cleared existing courses")

    // Now add new courses with correct lessons
    for (const course of courses) {
      const courseRef = await addDoc(collection(db, "courses"), course)
      console.log(`Created course: ${course.title} (${courseRef.id})`)

      const lessons = generateLessons(course.title, course.totalLessons)
      
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i]
        await setDoc(doc(db, "courses", courseRef.id, "lessons", `lesson-${i + 1}`), lesson)
        console.log(`  - Added lesson ${i + 1}/${lessons.length}: ${lesson.title}`)
      }
    }

    console.log("Database seeding completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  }
}

seedDatabase()
