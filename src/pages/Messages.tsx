import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, RequireAuth } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/validation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import { ListPager } from "@/components/ListPager";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function MessagesContent() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);

  const { data: messagePage, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["my-messages", page],
    enabled: !!user,
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`from_user_id.eq.${user!.id},to_user_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE);
      if (error) throw error;
      const list = data ?? [];
      return { rows: list.slice(0, PAGE_SIZE), hasMore: list.length > PAGE_SIZE };
    },
  });

  const messages = messagePage?.rows;
  const userIds = [...new Set(messages?.flatMap((m) => [m.from_user_id, m.to_user_id]) || [])];
  const listingIds = [...new Set(messages?.map((m) => m.listing_id) || [])];

  const { data: profiles, isError: profilesError } = useQuery({
    queryKey: ["profiles", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: listings, isError: listingsError } = useQuery({
    queryKey: ["listings-for-messages", listingIds],
    enabled: listingIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("id, title").in("id", listingIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const getProfileName = (profileId: string) => profiles?.find((p) => p.id === profileId)?.display_name || "Unknown";
  const getListingTitle = (listingId: string) => listings?.find((l) => l.id === listingId)?.title || "Unknown listing";

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <QueryError message="Could not load messages" onRetry={() => refetch()} />
      ) : !messages?.length ? (
        <div className="text-center py-20">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No messages yet</p>
        </div>
      ) : (
        <>
          {(profilesError || listingsError) && (
            <p className="text-sm text-destructive mb-3">Some sender or listing names could not be loaded.</p>
          )}
          <div className="space-y-3">
            {messages.map((msg) => {
              const isSent = msg.from_user_id === user!.id;
              return (
                <Card key={msg.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs text-muted-foreground">
                        {isSent ? `To ${getProfileName(msg.to_user_id)}` : `From ${getProfileName(msg.from_user_id)}`}
                        {" · "}
                        <span className="text-primary">{getListingTitle(msg.listing_id)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <ListPager
            page={page}
            hasMore={!!messagePage?.hasMore}
            disabled={isFetching}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  );
}

export default function Messages() {
  return (
    <RequireAuth>
      <MessagesContent />
    </RequireAuth>
  );
}
