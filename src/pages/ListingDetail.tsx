import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getListingImageUrl } from "@/lib/listing";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { MapPin, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [contactOpen, setContactOpen] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: ownerProfile } = useQuery({
    queryKey: ["profile", listing?.owner_id],
    enabled: !!listing,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name").eq("id", listing!.owner_id).single();
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("listings").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Listing deleted" });
      navigate("/my-listings");
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("messages").insert({
        listing_id: id!,
        from_user_id: user!.id,
        to_user_id: listing!.owner_id,
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Message sent!" });
      setMessage("");
      setContactOpen(false);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to send",
        description: err?.message || String(err),
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        <Skeleton className="aspect-video rounded-lg" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!listing) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Listing not found</div>;
  }

  const images = (listing.images as string[]) ?? [];
  const isOwner = user?.id === listing.owner_id;
  const mainImageUrl = getListingImageUrl(listing);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Images */}
      {images.length > 0 ? (
        <div className="mb-6">
          <Carousel className="w-full">
            <CarouselContent>
              {images.map((img, i) => (
                <CarouselItem key={i}>
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={img.startsWith("/") ? img : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/listing-images/${img}`}
                      alt={`${listing.title} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>
        </div>
      ) : (
        <div className="aspect-video rounded-lg bg-muted mb-6 overflow-hidden">
          <img
            src={mainImageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Details */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <p className="text-3xl font-bold text-primary mt-1">${Number(listing.price).toFixed(0)}</p>
          </div>
          <Badge variant="secondary">{listing.category}</Badge>
        </div>

        {listing.city && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" /> {listing.city}
          </p>
        )}

        {ownerProfile && (
          <p className="text-sm text-muted-foreground">Posted by {ownerProfile.display_name}</p>
        )}

        <p className="text-foreground whitespace-pre-wrap">{listing.description}</p>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          {isOwner ? (
            <>
              <Button variant="outline" onClick={() => navigate(`/edit/${listing.id}`)}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate()}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </>
          ) : user ? (
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-1" /> Contact Seller
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send a message</DialogTitle>
                </DialogHeader>
                <Textarea
                  placeholder="Hi, I'm interested in this listing..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                >
                  Send Message
                </Button>
              </DialogContent>
            </Dialog>
          ) : (
            <Button onClick={() => navigate("/auth")}>Sign in to contact seller</Button>
          )}
        </div>
      </div>
    </div>
  );
}
