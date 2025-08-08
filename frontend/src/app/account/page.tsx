"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, LogOut } from "lucide-react";
import { AuthContext } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountPage() {
  const { user, logout, loading, isAuthenticated } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow py-16 sm:py-20 lg:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <Skeleton className="h-10 w-1/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <Card className="bg-card border-border text-center p-6">
                  <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-4 w-full mx-auto" />
                </Card>
              </div>
              <div className="md:col-span-2">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <main className="flex-grow py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Account</h1>
          <p className="text-muted-foreground">Manage your profile and settings.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="bg-card border-border text-center p-6">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary">
                <AvatarImage src={user?.avatar_url} alt={user?.username || "User Avatar"} />
                <AvatarFallback>{user?.username?.substring(0, 2) || "GU"}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-white">{user?.username}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <Button variant="outline" className="mt-4 w-full">
                Change Avatar
              </Button>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal details here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-grow">
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="text-white">{user?.username}</p>
                  </div>
                  <Button variant="ghost">Edit</Button>
                </div>
                <div className="flex items-center gap-4">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-grow">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-white">{user?.email}</p>
                  </div>
                  <Button variant="ghost">Edit</Button>
                </div>
                <div className="flex items-center gap-4">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-grow">
                    <p className="text-sm text-muted-foreground">Password</p>
                    <p className="text-white">••••••••</p>
                  </div>
                  <Button variant="ghost">Change</Button>
                </div>
                <div className="border-t border-border pt-6">
                  <Button variant="destructive" className="w-full sm:w-auto" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
