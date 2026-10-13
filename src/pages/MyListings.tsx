import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getListingImageUrl } from "@/lib/listing";
import { formatListingPrice } from "@/lib/money";
import { PAGE_SIZE } from "@/lib/validation";
import { useAuth, RequireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import { ListPager } from "@/components/ListPager";
import { Pencil, Trash2, CreditCard, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

function MyListingsContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["my-listings", page],
    enabled: !!user,
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const { data: rows, error } = await supabase
        .from("listings")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE);
      if (error) throw error;
      const list = rows ?? [];
      return { rows: list.slice(0, PAGE_SIZE), hasMore: list.length > PAGE_SIZE };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", listingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      toast({ title: "Listing deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Could not delete", description: err.message, variant: "destructive" });
    },
  });

  const statusBadge = (listing: { paid: boolean; status: string }) => {
    if (!listing.paid) return <Badge variant="destructive">Unpaid</Badge>;
    if (listing.status === "sold") return <Badge variant="secondary">Sold</Badge>;
    return <Badge className="bg-primary text-primary-foreground">Active</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <Button size="sm" onClick={() => navigate("/create")}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <QueryError message="Could not load your listings" onRetry={() => refetch()} />
      ) : !data?.rows.length ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">You haven't posted any listings yet</p>
          <Button onClick={() => navigate("/create")}>
            <Plus className="h-4 w-4 mr-1" /> Post Your First Listing
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.rows.map((listing) => {
              const imgUrl = getListingImageUrl(listing);
              return (
                <Card key={listing.id} className="overflow-hidden">
                  <CardContent className="p-3 flex gap-3">
                    <img src={imgUrl} alt="" className="w-20 h-20 rounded-md object-cover bg-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{listing.title}</p>
                          <p className="text-sm text-primary font-semibold">{formatListingPrice(listing.price)}</p>
                        </div>
                        {statusBadge(listing)}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {!listing.paid && (
                          <Button size="sm" variant="default" onClick={() => navigate(`/pay/${listing.id}`)}>
                            <CreditCard className="h-3 w-3 mr-1" /> Pay Now
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/edit/${listing.id}`)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(listing.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <ListPager
            page={page}
            hasMore={data.hasMore}
            disabled={isFetching}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  );
}

export default function MyListings() {
  return (
    <RequireAuth>
      <MyListingsContent />
    </RequireAuth>
  );
}
