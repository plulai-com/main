// app/dashboard/profile/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  User, Mail, Lock, ImageIcon, Trophy, Award, Save, 
  Sparkles, Crown, Calendar, TrendingUp, Zap, Edit2,
  Globe, Shield, LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"

// Create inline Progress component
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={cn("w-full bg-gray-200 rounded-full h-2.5", className)}>
    <div 
      className="bg-primary h-2.5 rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
)

// Types
interface ProfileType {
  id: string;
  email: string;
  role: 'student' | 'admin';
  is_paid: boolean;
  language_preference: 'ar' | 'en' | 'fr';
  updated_at: string;
  avatar_id?: string;
  avatar_custom_url?: string;
  day_streak: number;
  username?: string;
  bio?: string;
  created_at?: string;
}

interface BadgeType {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  rarity: string;
  earned_at: string;
}

interface CertificateType {
  id: string;
  course_id: string;
  certificate_code: string;
  issued_at: string;
  course_title?: string;
}

interface AvatarType {
  id: string;
  name: string;
  seed: string;
  style: string;
  url: string;
  category: string;
  is_active: boolean;
}

interface UserProgressType {
  level: number;
  xp: number;
  updated_at: string;
}

interface DashboardData {
  profile: ProfileType;
  badges: BadgeType[];
  certificates: CertificateType[];
  avatars: AvatarType[];
  progress: UserProgressType;
}

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" }
]

export default function ProfilePage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    language: "en",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserId(session.user.id)
    }
    checkAuth()
  }, [supabase, router])

  // Fetch data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch all data for the current authenticated user
        const [profileRes, badgesRes, certificatesRes, avatarsRes, progressRes] = await Promise.all([
          fetch('/api/profile/me'),
          fetch('/api/user-badges/me'),
          fetch('/api/certificates/me'),
          fetch('/api/avatars'),
          fetch('/api/user-progress/me')
        ])

        // Check for authentication errors
        if (profileRes.status === 401) {
          router.push('/login')
          return
        }

        if (!profileRes.ok) {
          const error = await profileRes.json()
          throw new Error(error.error || 'Failed to fetch profile')
        }
        
        if (!badgesRes.ok) {
          const error = await badgesRes.json()
          throw new Error(error.error || 'Failed to fetch badges')
        }
        
        if (!certificatesRes.ok) {
          const error = await certificatesRes.json()
          throw new Error(error.error || 'Failed to fetch certificates')
        }
        
        if (!avatarsRes.ok) {
          const error = await avatarsRes.json()
          throw new Error(error.error || 'Failed to fetch avatars')
        }
        
        if (!progressRes.ok) {
          const error = await progressRes.json()
          throw new Error(error.error || 'Failed to fetch progress')
        }

        const [profile, badges, certificates, avatars, progress] = await Promise.all([
          profileRes.json(),
          badgesRes.json(),
          certificatesRes.json(),
          avatarsRes.json(),
          progressRes.json()
        ])

        // Extract username from email if not set
        const username = profile.username || profile.email?.split('@')[0] || 'User'
        
        setDashboardData({
          profile: { ...profile, username },
          badges,
          certificates,
          avatars: avatars.filter((a: AvatarType) => a.is_active),
          progress
        })

        // Initialize form data
        setFormData({
          username: profile.username || profile.email?.split('@')[0] || "",
          bio: profile.bio || "",
          language: profile.language_preference || "en",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
        console.error('Error fetching dashboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchDashboardData()
    }
  }, [userId, router])

  // Calculate stats
  const totalBadges = dashboardData?.badges.length || 0
  const totalCertificates = dashboardData?.certificates.length || 0
  const rarityCounts = dashboardData?.badges.reduce((acc, badge) => {
    acc[badge.rarity] = (acc[badge.rarity] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const getRarityColor = (rarity: string) => {
    const colors = {
      legendary: "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600",
      epic: "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500",
      rare: "bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500",
      common: "bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500"
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case "legendary": return <Crown className="size-4" />
      case "epic": return <Shield className="size-4" />
      case "rare": return <Zap className="size-4" />
      default: return <Trophy className="size-4" />
    }
  }

  const handleSaveProfile = async () => {
    if (!dashboardData) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          bio: formData.bio,
          language_preference: formData.language
        })
      })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      const updatedProfile = await response.json()
      
      setDashboardData(prev => prev ? {
        ...prev,
        profile: {
          ...prev.profile,
          username: formData.username,
          bio: formData.bio,
          language_preference: formData.language as 'en' | 'fr' | 'ar'
        }
      } : null)
      
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (err) {
      console.error('Error updating profile:', err)
      alert(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

// In your Profile Dashboard component, update the handleChangeAvatar function:
const handleChangeAvatar = async (avatar: AvatarType) => {
  if (!dashboardData) return
  
  setIsSaving(true)
  try {
    const response = await fetch('/api/profile/me/avatar', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ avatar_id: avatar.id })
    })

    if (response.status === 401) {
      router.push('/login')
      return
    }

    const responseData = await response.json()
    
    if (!response.ok) {
      const errorMessage = responseData.details 
        ? `${responseData.error}: ${responseData.details}`
        : responseData.error || 'Failed to update avatar'
      throw new Error(errorMessage)
    }

    // Update local state immediately with cache-busting
    const cacheBustingUrl = `${avatar.url}?t=${Date.now()}`
    
    setDashboardData(prev => prev ? {
      ...prev,
      profile: {
        ...prev.profile,
        avatar_id: avatar.id,
        avatar_custom_url: cacheBustingUrl
      }
    } : null)
    
    // Force a refresh of the profile data
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Re-fetch profile data to ensure it's fresh
      const profileRes = await fetch('/api/profile/me')
      if (profileRes.ok) {
        const freshProfile = await profileRes.json()
        setDashboardData(prev => prev ? {
          ...prev,
          profile: freshProfile
        } : null)
      }
    }
    
    setAvatarDialogOpen(false)
    alert('Avatar updated successfully!')
  } catch (err) {
    console.error('Error updating avatar:', err)
    alert(err instanceof Error ? err.message : 'Failed to update avatar')
  } finally {
    setIsSaving(false)
  }
}

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert("Passwords don't match!")
      return
    }
    
    if (formData.newPassword.length < 8) {
      alert("Password must be at least 8 characters long")
      return
    }

    setIsSaving(true)
    try {
      // Use Supabase auth API to change password
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) throw error

      // Reset form
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }))
      
      setPasswordDialogOpen(false)
      alert("Password changed successfully!")
    } catch (err) {
      console.error('Error changing password:', err)
      alert('Failed to change password')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-destructive/50">
          <CardContent className="p-8 text-center">
            <Shield className="mx-auto size-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              {error || "You need to be logged in to view your profile"}
            </p>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profile, badges, certificates, avatars, progress } = dashboardData

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header with logout */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and achievements</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <h3 className="text-3xl font-bold">{progress.level}</h3>
                <p className="text-xs text-muted-foreground">{progress.xp} XP</p>
              </div>
              <TrendingUp className="size-8 text-primary" />
            </div>
            <Progress value={(progress.xp % 1000) / 10} className="mt-4" />
          </CardContent>
        </Card>

        <Card className="bg-green-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Day Streak</p>
                <h3 className="text-3xl font-bold">{profile.day_streak}</h3>
                <p className="text-xs text-muted-foreground">days in a row</p>
              </div>
              <Zap className="size-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Badges</p>
                <h3 className="text-3xl font-bold">{totalBadges}</h3>
                <div className="flex gap-1 mt-1">
                  {Object.entries(rarityCounts).map(([rarity, count]) => (
                    <Badge key={rarity} variant="outline" className="text-xs">
                      {count} {rarity}
                    </Badge>
                  ))}
                </div>
              </div>
              <Trophy className="size-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificates</p>
                <h3 className="text-3xl font-bold">{totalCertificates}</h3>
                <p className="text-xs text-muted-foreground">achievements</p>
              </div>
              <Award className="size-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8 border-2 border-primary/20 shadow-2xl">
            <div className="h-32 bg-gradient-to-r from-primary via-secondary to-accent" />
            <CardContent className="relative -mt-16 pb-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center text-center space-y-4">
                <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="relative cursor-pointer group">
                      <Avatar className="h-40 w-40 border-4 border-background shadow-2xl ring-4 ring-primary/20">
                        <AvatarImage
                          src={profile.avatar_custom_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`}
                        />
                        <AvatarFallback className="text-3xl font-bold">
                          {profile.email?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="text-white size-10" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="text-accent size-5" />
                        Choose Your Avatar
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="grid grid-cols-4 gap-4">
                        {avatars.map((avatar) => (
                          <button
                            key={avatar.id}
                            onClick={() => handleChangeAvatar(avatar)}
                            disabled={isSaving}
                            className="relative group flex flex-col items-center"
                          >
                            <Avatar className="h-24 w-24 border-2 border-border hover:border-primary transition-all hover:scale-110">
                              <AvatarImage src={avatar.url} />
                            </Avatar>
                            <p className="text-xs text-center mt-2 font-medium">{avatar.name}</p>
                            <p className="text-[10px] text-muted-foreground">{avatar.category}</p>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                {/* Profile Info */}
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{profile.username}</h1>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      {profile.role === "admin" ? "👑 Admin" : "🎓 Student"}
                    </Badge>
                    {profile.is_paid && (
                      <Badge className="bg-gradient-to-r from-amber-400 to-orange-500">
                        <Crown className="size-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Mail className="size-4" />
                    {profile.email}
                  </p>
                  {profile.created_at && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Calendar className="size-4" />
                      Member since {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="pt-4 border-t">
                    <p className="text-sm italic text-center">"{profile.bio}"</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 w-full pt-4">
                  <Button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className="gap-2 w-full"
                    variant={isEditing ? "default" : "outline"}
                  >
                    <Edit2 className="size-4" />
                    {isEditing ? "Cancel Editing" : "Edit Profile"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 gap-2">
              <TabsTrigger value="profile" className="gap-2">
                <User className="size-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="badges" className="gap-2">
                <Trophy className="size-4" />
                Badges
              </TabsTrigger>
              <TabsTrigger value="certificates" className="gap-2">
                <Award className="size-4" />
                Certificates
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Display Name</Label>
                    <Input
                      id="username"
                      placeholder="Choose a cool nickname"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your coding journey, favorite projects, or learning goals..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Share what you're learning or building!
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language" className="flex items-center gap-2">
                      <Globe className="size-4" />
                      Preferred Language
                    </Label>
                    <select
                      id="language"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      disabled={!isEditing}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isEditing && (
                    <div className="pt-4">
                      <Button 
                        onClick={handleSaveProfile} 
                        disabled={isSaving} 
                        className="gap-2 w-full"
                      >
                        <Save className="size-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Password Change Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Change your password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2" variant="outline">
                        <Lock className="size-4" />
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword ? "text" : "password"}
                              value={formData.currentPassword}
                              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? "Hide" : "Show"}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          />
                        </div>
                        <Button onClick={handleChangePassword} disabled={isSaving} className="w-full">
                          {isSaving ? "Changing..." : "Update Password"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Achievements</CardTitle>
                  <CardDescription>
                    {totalBadges} badges earned • {rarityCounts.legendary || 0} legendary • {rarityCounts.epic || 0} epic
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {badges.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="mx-auto text-muted-foreground size-16 mb-4" />
                      <p className="text-lg font-semibold mb-2">No Badges Yet</p>
                      <p className="text-sm text-muted-foreground">
                        Complete lessons and challenges to earn your first badge!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {badges.map((badge) => (
                        <Card 
                          key={badge.id} 
                          className={cn(
                            "overflow-hidden border-2 transition-all hover:scale-[1.02]",
                            badge.rarity === "legendary" ? "border-amber-500/50" :
                            badge.rarity === "epic" ? "border-purple-500/50" :
                            badge.rarity === "rare" ? "border-blue-500/50" : ""
                          )}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className={cn(
                                "h-12 w-12 rounded-lg flex items-center justify-center",
                                getRarityColor(badge.rarity)
                              )}>
                                {getRarityIcon(badge.rarity)}
                              </div>
                              <Badge variant="secondary" className="text-xs font-bold uppercase">
                                {badge.rarity}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-bold text-lg">{badge.name}</h3>
                              <p className="text-sm text-muted-foreground">{badge.description}</p>
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-muted-foreground">
                                  Earned {new Date(badge.earned_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Certificates</CardTitle>
                  <CardDescription>Official recognition of your learning achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  {certificates.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="mx-auto text-muted-foreground size-16 mb-4" />
                      <p className="text-lg font-semibold mb-2">No Certificates Yet</p>
                      <p className="text-sm text-muted-foreground">
                        Complete courses to earn certificates!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {certificates.map((cert) => (
                        <Card key={cert.id} className="border-2 border-accent/30">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <Award className="text-accent size-12" />
                              <Badge variant="outline" className="border-accent/50 text-accent">
                                VERIFIED
                              </Badge>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-bold text-xl mb-1">{cert.course_title || "Course Certificate"}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Issued on {new Date(cert.issued_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground mb-1">Certificate Code</p>
                                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                  {cert.certificate_code}
                                </code>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}