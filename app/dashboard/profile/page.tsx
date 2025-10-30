"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, User, Mail, Trash2, LogOut } from "lucide-react"
import { LoaderOne } from "@/components/ui/loader"
import Footer from "@/components/Footer"

interface UserProfile {
  name: string
  email: string
  avatar: string
}

export default function ProfilePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [pageLoading, setPageLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchProfile = async () => {
    try {
      const userRef = doc(db, "users", user!.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile
        setProfile(data)
        setName(data.name)
      } else {
        // Create profile if it doesn't exist
        const newProfile = {
          name: user?.displayName || user?.email?.split("@")[0] || "User",
          email: user?.email || "",
          avatar: user?.photoURL || "",
        }
        await setDoc(doc(db, "users", user!.uid), newProfile)
        setProfile(newProfile)
        setName(newProfile.name)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setPageLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    setUpdating(true)
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, { name })
      
      setProfile({ ...profile!, name })
      setEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return
    
    const file = e.target.files[0]
    if (!file) return

    // Create a simple URL from file (in production, upload to Firebase Storage)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const avatarUrl = event.target?.result as string
      
      try {
        const userRef = doc(db, "users", user.uid)
        await updateDoc(userRef, { avatar: avatarUrl })
        setProfile({ ...profile!, avatar: avatarUrl })
      } catch (error) {
        console.error("Error updating avatar:", error)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteAccount = async () => {
    if (!user || !confirm("Are you sure? This action cannot be undone.")) return

    try {
      const enrollmentsRef = collection(db, "users", user.uid, "enrollments")
      const enrollmentsSnap = await getDocs(enrollmentsRef)
      for (const doc of enrollmentsSnap.docs) {
        await deleteDoc(doc.ref)
      }

      const progressRef = collection(db, "users", user.uid, "lessonProgress")
      const progressSnap = await getDocs(progressRef)
      for (const doc of progressSnap.docs) {
        await deleteDoc(doc.ref)
      }

      await deleteDoc(doc(db, "users", user.uid))
      // Note: Firebase auth user deletion requires re-authentication
      // For now, just sign out the user
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Error deleting account:", error)
    }
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
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            SkillSync
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Profile Settings</h1>

        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Account Information</h2>

          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8 pb-6 border-b border-border">
              <div className="relative">
                <Avatar className="w-32 h-32 mb-4">
                  <AvatarImage src={user?.photoURL || profile?.avatar || ""} />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                    {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition">
                  <Camera className="w-5 h-5" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground text-center">Click the camera icon to upload a new avatar</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <User className="w-4 h-4" />
                Name
              </label>
              {editing ? (
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              ) : (
                <p className="text-foreground">{profile?.name}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="text-foreground">{profile?.email || user?.email}</p>
            </div>

            <div className="flex gap-4">
              {editing ? (
                <>
                  <Button onClick={handleUpdateProfile} disabled={updating}>
                    {updating ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-destructive">Danger Zone</h2>

          <div className="space-y-4">
            <Button variant="outline" onClick={logout} className="w-full bg-transparent hover:bg-secondary flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Deleting your account will permanently remove all your data including course progress and enrollments.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
