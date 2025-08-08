"use client";

import { notFound, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ThumbsUp, ThumbsDown, Send, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo, useContext, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { AuthContext } from "@/contexts/auth-context";
import { formatDistanceToNow } from "date-fns";
import { marked } from "marked";
import { cn } from "@/lib/utils";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis } from "@/components/ui/pagination";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const REPLIES_PER_PAGE = 10;

interface Author {
  _id: string;
  username: string;
  avatar_url?: string;
}

interface PostReply {
  _id: string;
  author_id: string;
  content: string;
  created_at: string;
}

interface ForumPost {
  _id: string;
  title: string;
  category: string;
  author_id: string;
  content: string;
  created_at: string;
}

interface Reaction {
  _id: string;
  user_id: string;
  target_id: string;
  target_model: "ForumThread" | "ForumReply";
  reaction_type: "like" | "dislike";
}

const PostPageLoader = () => (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
    <div className="mb-8">
      <Skeleton className="h-10 w-40" />
    </div>
    <header className="mb-8">
      <Skeleton className="h-6 w-24 mb-2" />
      <Skeleton className="h-10 w-full mb-2" />
      <Skeleton className="h-5 w-1/3" />
    </header>
    <Card className="bg-card border-border mb-8">
      <CardHeader className="flex-row gap-4 items-start p-4 border-b border-border">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </CardContent>
    </Card>
    <h2 className="text-2xl font-bold text-white mb-6">
      <Skeleton className="h-8 w-32" />
    </h2>
  </div>
);

const getCategoryBadgeColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case "builds":
      return "bg-blue-500";
    case "support":
      return "bg-green-500";
    case "hardware":
      return "bg-red-500";
    case "gaming":
      return "bg-purple-500";
    case "performance":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
};

function PostPageContent() {
  const params = useParams();
  const postId = params.postId as string;
  const { toast } = useToast();
  const { user, token, isAuthenticated } = useContext(AuthContext);

  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<PostReply[]>([]);
  const [users, setUsers] = useState<Author[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactingTo, setReactingTo] = useState<string | null>(null);

  const [repliesCurrentPage, setRepliesCurrentPage] = useState(1);
  const [repliesTotalPages, setRepliesTotalPages] = useState(1);
  const [repliesTotal, setRepliesTotal] = useState(0);
  const [loadingReplies, setLoadingReplies] = useState(true);

  const usersMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user._id] = user;
      return acc;
    }, {} as Record<string, Author>);
  }, [users]);

  const fetchReplies = async (page = 1) => {
    setLoadingReplies(true);
    try {
      if (!API_BASE_URL) throw new Error("API URL not configured.");
      const repliesResponse = await axios.post(`${API_BASE_URL}/forumreplies/search`, {
        query: { thread_id: postId },
        page: page,
        per_page: REPLIES_PER_PAGE,
      });
      setReplies(repliesResponse.data.data);
      setRepliesTotalPages(repliesResponse.data.pagination.total_pages);
      setRepliesCurrentPage(repliesResponse.data.pagination.current_page);
      setRepliesTotal(repliesResponse.data.pagination.total);
    } catch (error) {
      // console.error("Failed to fetch replies:", error);
      toast({ title: "Error", description: "Could not fetch replies.", variant: "destructive" });
    } finally {
      setLoadingReplies(false);
    }
  };

  useEffect(() => {
    const fetchPostData = async () => {
      setLoading(true);
      if (!API_BASE_URL) {
        toast({ title: "Error", description: "API URL not configured.", variant: "destructive" });
        setLoading(false);
        return;
      }
      try {
        const [postResponse, usersResponse, reactionsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/forumthreads/${postId}`),
          axios.get(`${API_BASE_URL}/all-users-info`),
          axios.get(`${API_BASE_URL}/reactions?no_pagination=true`),
        ]);

        setPost(postResponse.data.data);
        setUsers(usersResponse.data.data);
        setReactions(reactionsResponse.data.data);
      } catch (error) {
        // console.error("Failed to fetch post data:", error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPostData();
      fetchReplies(repliesCurrentPage);
    }
  }, [postId, toast]);

  useEffect(() => {
    if (postId) {
      fetchReplies(repliesCurrentPage);
    }
  }, [repliesCurrentPage, postId]);

  const getReactionsFor = (targetId: string, targetModel: "ForumThread" | "ForumReply") => {
    const filteredReactions = reactions.filter((r) => r.target_id === targetId && r.target_model === targetModel);
    const likes = filteredReactions.filter((r) => r.reaction_type === "like").length;
    const dislikes = filteredReactions.filter((r) => r.reaction_type === "dislike").length;
    const userReaction = user ? filteredReactions.find((r) => r.user_id === user._id) : null;
    return { likes, dislikes, userReaction };
  };

  const handleReaction = async (targetId: string, targetModel: "ForumThread" | "ForumReply", newReactionType: "like" | "dislike") => {
    if (!isAuthenticated || !user || !token) {
      toast({ title: "Please log in to react.", variant: "destructive" });
      return;
    }

    if (!API_BASE_URL) throw new Error("API base URL is not configured.");

    const { userReaction } = getReactionsFor(targetId, targetModel);

    if (reactingTo === targetId) return;

    setReactingTo(targetId);
    const originalReactions = [...reactions];

    try {
      if (userReaction) {
        if (userReaction.reaction_type === newReactionType) {
          setReactions((prev) => prev.filter((r) => r._id !== userReaction._id));
          await axios.delete(`${API_BASE_URL}/reactions/${userReaction._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          const updatedReaction = { ...userReaction, reaction_type: newReactionType };
          setReactions((prev) => prev.map((r) => (r._id === userReaction._id ? updatedReaction : r)));
          await axios.put(`${API_BASE_URL}/reactions/${userReaction._id}`, { reaction_type: newReactionType }, { headers: { Authorization: `Bearer ${token}` } });
        }
      } else {
        const optimisticReaction = { _id: `temp-${Date.now()}`, user_id: user._id, target_id: targetId, target_model: targetModel, reaction_type: newReactionType };
        setReactions((prev) => [...prev, optimisticReaction]);

        const response = await axios.post(
          `${API_BASE_URL}/reactions`,
          { user_id: user._id, target_id: targetId, target_model: targetModel, reaction_type: newReactionType },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const newReaction = response.data.data;
        setReactions((prev) => prev.map((r) => (r._id === optimisticReaction._id ? newReaction : r)));
      }
    } catch (error: any) {
      setReactions(originalReactions);
      const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error?.message : error.message;
      toast({ title: "Error", description: errorMessage || "Could not save your reaction.", variant: "destructive" });
    } finally {
      setReactingTo(null);
    }
  };

  if (loading) {
    return (
      <main className="flex-grow py-16 sm:py-20 lg:py-24 bg-background">
        <PostPageLoader />
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex-grow py-16 sm:py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <h1 className="text-2xl font-bold text-white">Post not found</h1>
          <p className="text-muted-foreground mt-2">This post may have been removed or does not exist.</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/forum">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forum
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast({ title: "Please log in to reply.", variant: "destructive" });
      return;
    }
    if (!replyContent.trim()) {
      toast({
        title: "Empty Reply",
        description: "Please write something before submitting.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      if (!API_BASE_URL) throw new Error("API base URL is not configured.");

      await axios.post(
        `${API_BASE_URL}/forumreplies`,
        {
          thread_id: post._id,
          author_id: user._id,
          content: replyContent,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReplyContent("");
      const pageToFetch = repliesTotalPages > 0 ? repliesTotalPages : 1;
      await fetchReplies(pageToFetch);

      toast({
        title: "Reply Submitted!",
        description: "Your reply has been posted.",
      });
    } catch (error: any) {
      const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error?.message || error.message : error.message;
      toast({
        title: "Error submitting reply",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= repliesTotalPages) {
      setRepliesCurrentPage(page);
    }
  };

  const getPaginationItems = () => {
    if (repliesTotalPages <= 5) {
      return Array.from({ length: repliesTotalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (repliesCurrentPage <= 3) {
      pages.push(1, 2, 3, "...", repliesTotalPages);
    } else if (repliesCurrentPage >= repliesTotalPages - 2) {
      pages.push(1, "...", repliesTotalPages - 2, repliesTotalPages - 1, repliesTotalPages);
    } else {
      pages.push(1, "...", repliesCurrentPage - 1, repliesCurrentPage, repliesCurrentPage + 1, "...", repliesTotalPages);
    }
    return pages.filter((value, index, self) => self.indexOf(value) === index);
  };

  const paginationItems = getPaginationItems();
  const postAuthor = usersMap[post.author_id];
  const parsedPostContent = marked(post.content) as string;
  const postReactions = getReactionsFor(post._id, "ForumThread");
  const isReactingToPost = reactingTo === post._id;

  const repliesStart = (repliesCurrentPage - 1) * REPLIES_PER_PAGE + 1;
  const repliesEnd = repliesStart + replies.length - 1;

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
        <header className="mb-8">
          <Badge variant="secondary" className={`${getCategoryBadgeColor(post.category)} text-white mb-2`}>
            {post.category}
          </Badge>
          <h1 className="text-4xl font-bold text-white">{post.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <span>Posted by {postAuthor?.username || "Unknown User"}</span>
            {post.created_at && (
              <>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
              </>
            )}
          </div>
        </header>

        {/* Original Post */}
        <Card className="bg-card border-border mb-8">
          <CardHeader className="flex-row gap-4 items-start p-4 border-b border-border">
            <Avatar className="h-12 w-12">
              <AvatarImage src={postAuthor?.avatar_url} alt={postAuthor?.username} />
              <AvatarFallback>{postAuthor?.username?.substring(0, 2).toUpperCase() || "GU"}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="font-semibold text-white">{postAuthor?.username || "Unknown User"}</p>
              {post.created_at && <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(post.created_at))} ago</p>}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-invert prose-lg max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: parsedPostContent }} />
          </CardContent>
          <CardFooter className="p-4 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleReaction(post._id, "ForumThread", "like")} disabled={isReactingToPost}>
              {isReactingToPost ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ThumbsUp className={cn("h-4 w-4 mr-2", postReactions.userReaction?.reaction_type === "like" && "text-primary fill-primary")} />
              )}
              Like ({postReactions.likes})
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleReaction(post._id, "ForumThread", "dislike")} disabled={isReactingToPost}>
              {isReactingToPost ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ThumbsDown className={cn("h-4 w-4 mr-2", postReactions.userReaction?.reaction_type === "dislike" && "text-primary fill-primary")} />
              )}
              Dislike ({postReactions.dislikes})
            </Button>
          </CardFooter>
        </Card>

        {/* Replies */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Replies</h2>
          {repliesTotal > 0 && <p className="text-muted-foreground mt-1">{loadingReplies ? "Loading..." : `Showing ${repliesStart}-${repliesEnd} of ${repliesTotal} replies`}</p>}
        </div>
        <div className="space-y-6">
          {loadingReplies ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardHeader className="flex-row gap-4 items-start p-4 border-b border-border">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))
          ) : replies.length > 0 ? (
            replies.map((reply) => {
              const replyAuthor = usersMap[reply.author_id];
              const parsedReplyContent = marked(reply.content) as string;
              const replyReactions = getReactionsFor(reply._id, "ForumReply");
              const isReactingToReply = reactingTo === reply._id;
              return (
                <Card key={reply._id} className="bg-card border-border">
                  <CardHeader className="flex-row gap-4 items-start p-4 border-b border-border">
                    <Avatar>
                      <AvatarImage src={replyAuthor?.avatar_url} alt={replyAuthor?.username} />
                      <AvatarFallback>{replyAuthor?.username?.substring(0, 2).toUpperCase() || "GU"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white">{replyAuthor?.username || "Unknown User"}</p>
                      {reply.created_at && <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(reply.created_at))} ago</p>}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 prose prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: parsedReplyContent }} />
                  <CardFooter className="p-3 border-t border-border flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleReaction(reply._id, "ForumReply", "like")} disabled={isReactingToReply}>
                      {isReactingToReply ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ThumbsUp className={cn("h-4 w-4 mr-2", replyReactions.userReaction?.reaction_type === "like" && "text-primary fill-primary")} />
                      )}
                      ({replyReactions.likes})
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleReaction(reply._id, "ForumReply", "dislike")} disabled={isReactingToReply}>
                      {isReactingToReply ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ThumbsDown className={cn("h-4 w-4 mr-2", replyReactions.userReaction?.reaction_type === "dislike" && "text-primary fill-primary")} />
                      )}
                      ({replyReactions.dislikes})
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <p className="text-muted-foreground">No replies yet. Be the first to respond!</p>
          )}
        </div>

        {repliesTotalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button variant="ghost" size="icon" onClick={() => handlePageChange(repliesCurrentPage - 1)} disabled={repliesCurrentPage === 1 || loadingReplies} aria-label="Previous page">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </PaginationItem>
                {paginationItems.map((item, index) => (
                  <PaginationItem key={index}>
                    {typeof item === "number" ? (
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(item);
                        }}
                        isActive={repliesCurrentPage === item}
                        aria-disabled={loadingReplies}
                      >
                        {item}
                      </PaginationLink>
                    ) : (
                      <PaginationEllipsis />
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageChange(repliesCurrentPage + 1)}
                    disabled={repliesCurrentPage === repliesTotalPages || loadingReplies}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Reply Form */}
        <Card className="bg-card border-border mt-12">
          <CardHeader>
            <h3 className="text-xl font-bold text-white">Leave a Reply</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReplySubmit}>
              <Textarea
                placeholder="Write your reply here..."
                className="min-h-[150px] bg-background border-border"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                required
                disabled={!isAuthenticated}
              />
              <div className="mt-4 flex justify-end">
                <Button type="submit" disabled={isSubmitting || !isAuthenticated}>
                  {isSubmitting ? "Submitting..." : "Submit Reply"}
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

export default function PostPage() {
  return (
    <Suspense fallback={<PostPageLoader />}>
      <PostPageContent />
    </Suspense>
  );
}
