import Link from "next/link"

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
}

export default function CourseCard({ course }: CourseCardProps) {
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

  return (
    <Link href={`/courses/${course.id}`}>
      <div className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 transform cursor-pointer h-full border border-purple-200 dark:border-purple-800">
        <div className={`h-24 bg-gradient-to-br ${colorScheme.bg} dark:${colorScheme.bg} flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors"></div>
          <div className="text-4xl group-hover:scale-110 transition-transform relative z-10">
            {progress === 100 ? '🎉' : progress > 50 ? '📖' : '🚀'}
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {course.title}
          </h3>
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
        </div>
      </div>
    </Link>
  )
}
