"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Author {
  _id: string;
  username: string;
  avatar_url?: string;
}
interface ForumThread {
  _id: string;
  title: string;
  category: string;
  author_id: string;
  replies_count: number;
  updated_at: string;
}

interface ForumReply {
  thread_id: string;
}

const THREADS_PER_PAGE = 10;

const ForumLoader = () => (
  <Table>
    <TableHeader>
      <TableRow className="hover:bg-card">
        <TableHead className="w-[60%] text-white">Thread</TableHead>
        <TableHead className="text-center text-white">Replies</TableHead>
        <TableHead className="text-right text-white">Last Activity</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: THREADS_PER_PAGE }).map((_, i) => (
        <TableRow key={i} className="border-b-border">
          <TableCell>
            <div className="flex items-center gap-4">
              <Skeleton className="hidden sm:flex h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </TableCell>
          <TableCell className="text-center">
            <Skeleton className="h-5 w-10 mx-auto" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-5 w-24 ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const getCategoryBadgeColor = (category: string) => {
  switch (category.toLowerCase()) {
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

export default function ForumPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [forumThreads, setForumThreads] = useState<ForumThread[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState<Author[]>([]);
  const [allReplies, setAllReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const usersMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user._id] = user;
      return acc;
    }, {} as Record<string, Author>);
  }, [users]);

  const replyCounts = useMemo(() => {
    return allReplies.reduce((acc, reply) => {
      acc[reply.thread_id] = (acc[reply.thread_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [allReplies]);

  useEffect(() => {
    const fetchForumData = async () => {
      setLoading(true);
      try {
        if (!API_BASE_URL) throw new Error("API base URL is not configured.");

        const [threadsResponse, usersResponse, repliesResponse] = await Promise.all([
          axios.post(`${API_BASE_URL}/forumthreads/search`, {
            page: currentPage,
            per_page: THREADS_PER_PAGE,
            sort: { updated_at: -1 },
          }),
          axios.get(`${API_BASE_URL}/all-users-info`),
          axios.get(`${API_BASE_URL}/forumreplies?no_pagination=true`),
        ]);

        const { data: threadsData, pagination } = threadsResponse.data;
        setForumThreads(threadsData || []);
        setTotalPages(pagination.total_pages || 1);

        const { data: usersData } = usersResponse.data;
        setUsers(usersData || []);

        const { data: repliesData } = repliesResponse.data;
        setAllReplies(repliesData || []);
      } catch (error: any) {
        toast({
          title: "Error Fetching Forum Data",
          description: error.message || "Could not load data from the server.",
          variant: "destructive",
        });
        setForumThreads([]);
        setUsers([]);
        setAllReplies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchForumData();
  }, [currentPage, toast]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPaginationItems = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages.filter((value, index, self) => self.indexOf(value) === index);
  };

  const paginationItems = getPaginationItems();

  return (
    <>
      <section className="bg-card/50 py-16 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <MessageSquare className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-white">Community Forum</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Join the discussion, ask questions, and share your expertise with fellow tech enthusiasts.</p>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Latest Threads</h2>
            <Link href="/forum/new" passHref>
              <Button>
                <PlusCircle className="mr-2 h-5 w-5" />
                Create New Post
              </Button>
            </Link>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {loading ? (
                <ForumLoader />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-card">
                      <TableHead className="w-[60%] text-white">Thread</TableHead>
                      <TableHead className="text-center text-white">Replies</TableHead>
                      <TableHead className="text-right text-white">Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forumThreads.length > 0 ? (
                      forumThreads.map((thread) => {
                        const author = usersMap[thread.author_id];
                        const authorUsername = author?.username || "Unknown User";
                        const numReplies = replyCounts[thread._id] || 0;
                        return (
                          <TableRow key={thread._id} className="border-b-border">
                            <TableCell>
                              <div className="flex items-center gap-4">
                                <Avatar className="hidden sm:flex h-10 w-10">
                                  <AvatarImage src={author?.avatar_url} alt={authorUsername} />
                                  <AvatarFallback>{authorUsername?.substring(0, 2).toUpperCase() || "GU"}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link href={`/forum/${thread._id}`} className="font-semibold text-white hover:text-primary transition-colors text-base">
                                    {thread.title}
                                  </Link>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <Badge variant="secondary" className={`${getCategoryBadgeColor(thread.category)} text-white border-none`}>
                                      {thread.category}
                                    </Badge>
                                    <span>by {authorUsername}</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                                <MessageSquare className="h-4 w-4" />
                                <span>{numReplies}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatDistanceToNow(new Date(thread.updated_at))} ago</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                          No threads found. Be the first to create one!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button variant="ghost" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} aria-label="Previous page">
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
                          isActive={currentPage === item}
                          aria-disabled={loading}
                        >
                          {item}
                        </PaginationLink>
                      ) : (
                        <PaginationEllipsis />
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <Button variant="ghost" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} aria-label="Next page">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
