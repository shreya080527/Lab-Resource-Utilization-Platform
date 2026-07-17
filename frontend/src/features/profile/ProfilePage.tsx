import * as React from "react";
import { 
  User, Mail, Phone, MapPin, Briefcase, Building2, Shield, 
  Camera, Lock, Check, Loader2, AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";
import { userApi, type ProfileUpdatePayload, type PasswordChangePayload } from "@/lib/api/userApi";
import type { User } from "@/types";

function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message?: unknown }).message);
  }
  return "Something went wrong";
}

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false);
  
  const [username, setUsername] = React.useState("");
  const [name, setName] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [designation, setDesignation] = React.useState("");
  
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  
  React.useEffect(() => {
    userApi.getProfile()
      .then((data) => {
        setProfile(data);
        setUsername(data.username || "");
        setName(data.name || "");
        setPhoneNumber(data.phoneNumber || "");
        setAddress(data.address || "");
        setDesignation(data.designation || "");
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload: ProfileUpdatePayload = {
        username: username !== profile?.username ? username : undefined,
        name: name !== profile?.name ? name : undefined,
        phoneNumber: phoneNumber !== profile?.phoneNumber ? phoneNumber : undefined,
        address: address !== profile?.address ? address : undefined,
        designation: designation !== profile?.designation ? designation : undefined,
      };
      
      const updated = await userApi.updateProfile(payload);
      setProfile(updated);
      if (setUser) setUser(updated);
      toast.success("Profile updated successfully");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    setSaving(true);
    try {
      const payload: PasswordChangePayload = {
        currentPassword,
        newPassword,
      };
      await userApi.changePassword(payload);
      toast.success("Password changed successfully");
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm font-medium">Failed to load profile</p>
      </div>
    );
  }

  const initials = profile.username?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="size-20 rounded-2xl">
            {profile.profilePictureUrl && <AvatarImage src={profile.profilePictureUrl} />}
            <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-xl font-bold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110">
            <Camera className="size-4" />
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.name || profile.username}</h1>
          <p className="text-muted-foreground">{profile.email}</p>
          <Badge variant="outline" className="mt-1">
            <Shield className="mr-1 size-3" />
            {profile.role?.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Profile Information */}
      <Card className="rounded-2xl border-border/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Personal Information</h2>
          <Button onClick={handleSaveProfile} disabled={saving} size="sm">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Save Changes
          </Button>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                placeholder="Your full name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                value={profile.email || ""}
                disabled
                className="pl-10 bg-muted/50"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-10"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="pl-10"
                placeholder="Your position"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-10"
                placeholder="Your address"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Organization */}
      <Card className="rounded-2xl border-border/60 p-6">
        <h2 className="mb-4 text-lg font-semibold">Organization</h2>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Institution</Label>
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
              <Building2 className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{profile.institution?.name || "—"}</span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Department</Label>
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
              <Building2 className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{profile.department?.name || "—"}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card className="rounded-2xl border-border/60 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Security</h2>
              <p className="text-sm text-muted-foreground">Manage your password</p>
            </div>
          </div>
          
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">Change Password</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your current password and choose a new password.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                
                {passwordError && (
                  <p className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="size-4" />
                    {passwordError}
                  </p>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleChangePassword} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Change Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
}
