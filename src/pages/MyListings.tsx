import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getListingImageUrl } from "@/lib/listing";
import { useAuth, RequireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, CreditCard, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

function MyListingsContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      toast({ title: "Listing deleted" });
    },
  });

  const statusBadge = (listing: any) => {
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
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : !listings?.length ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">You haven't posted any listings yet</p>
          <Button onClick={() => navigate("/create")}>
            <Plus className="h-4 w-4 mr-1" /> Post Your First Listing
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const imgUrl = getListingImageUrl(listing);
            return (
              <Card key={listing.id} className="overflow-hidden">
                <CardContent className="p-3 flex gap-3">
                  <img src={imgUrl} alt="" className="w-20 h-20 rounded-md object-cover bg-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{listing.title}</p>
                        <p className="text-sm text-primary font-semibold">${Number(listing.price).toFixed(0)}</p>
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
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(listing.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
