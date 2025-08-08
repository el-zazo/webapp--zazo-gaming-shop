
'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthContext } from '@/contexts/auth-context';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function NewPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user, token } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create a post.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    if (!title || !content || !category) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill out the title, content, and category.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (!API_BASE_URL) throw new Error("API base URL is not configured.");
      
      await axios.post(
        `${API_BASE_URL}/forumthreads`,
        {
          title,
          content,
          category,
          author_id: user._id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      toast({
        title: 'Post Created!',
        description: 'Your new thread has been successfully created.',
      });
      
      router.push('/forum');
    } catch (error: any) {
      const errorMessage = axios.isAxiosError(error)
          ? error.response?.data?.error?.message || error.message
          : error.message;
      toast({
        title: 'Submission Failed',
        description: errorMessage || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-grow py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-8">
          <Button asChild variant="outline">
            <Link href="/forum">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forum
            </Link>
          </Button>
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-white">Create a New Post</CardTitle>
            <CardDescription className="text-muted-foreground">
              Share your thoughts, ask a question, or start a discussion with the community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="post-title" className="text-lg font-medium text-white">Post Title</Label>
                <Input
                  id="post-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title for your post"
                  className="mt-2 bg-background border-border"
                  required
                  disabled={isSubmitting}
                />
              </div>
               <div>
                <Label htmlFor="post-category" className="text-lg font-medium text-white">Category</Label>
                <Select onValueChange={setCategory} value={category} disabled={isSubmitting}>
                  <SelectTrigger id="post-category" className="mt-2 bg-background border-border">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Builds">Builds</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                    <SelectItem value="Gaming">Gaming</SelectItem>
                    <SelectItem value="Performance">Performance</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="post-content" className="text-lg font-medium text-white">Your Message</Label>
                <Textarea
                  id="post-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your message here. You can use markdown for formatting."
                  className="mt-2 min-h-[200px] bg-background border-border"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Post'}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
