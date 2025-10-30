import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-start">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-400 transition duration-200 hover:text-purple-600 dark:hover:text-purple-400"
            >
              Dashboard
            </Link>
            <Link
              href="/courses"
              className="text-gray-600 dark:text-gray-400 transition duration-200 hover:text-purple-600 dark:hover:text-purple-400"
            >
              Courses
            </Link>
            <Link
              href="/dashboard/analytics"
              className="text-gray-600 dark:text-gray-400 transition duration-200 hover:text-purple-600 dark:hover:text-purple-400"
            >
              Analytics
            </Link>
            <Link
              href="/dashboard/profile"
              className="text-gray-600 dark:text-gray-400 transition duration-200 hover:text-purple-600 dark:hover:text-purple-400"
            >
              Profile
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} All Rights Reserved by{" "}
          <a
            href="https://muhammadhasanbaig.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition duration-200"
          >
            Muhammad Hasan Baig
          </a>
        </div>
      </div>
    </footer>
  )
}
