import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, RequireAuth } from "@/lib/auth";
import { LISTING_CATEGORIES } from "@/lib/listing";
import { centsToDollarString, dollarsToCents, parseDollarInputToCents } from "@/lib/money";
import { isUuid, listingFormSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import { toast } from "@/hooks/use-toast";

function EditListingForm() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<(typeof LISTING_CATEGORIES)[number]>("Other");
  const [city, setCity] = useState("");
  const validId = isUuid(id);

  const { data: listing, isLoading, isError, refetch } = useQuery({
    queryKey: ["listing", id],
    enabled: validId,
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setDescription(listing.description);
      setPrice(centsToDollarString(dollarsToCents(listing.price)));
      setCategory(
        LISTING_CATEGORIES.includes(listing.category as (typeof LISTING_CATEGORIES)[number])
          ? (listing.category as (typeof LISTING_CATEGORIES)[number])
          : "Other",
      );
      setCity(listing.city || "");
    }
  }, [listing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !listing || user.id !== listing.owner_id) {
      toast({ title: "Not authorized", variant: "destructive" });
      return;
    }
    const parsed = listingFormSchema.safeParse({ title, description, price, category, city });
    if (!parsed.success) {
      toast({
        title: "Check the form",
        description: parsed.error.errors[0]?.message ?? "Invalid listing",
        variant: "destructive",
      });
      return;
    }
    const cents = parseDollarInputToCents(parsed.data.price);
    if (cents === null) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("listings")
        .update({
          title: parsed.data.title,
          description: parsed.data.description,
          price: Number(centsToDollarString(cents)),
          category: parsed.data.category,
          city: parsed.data.city || null,
        })
        .eq("id", id!);
      if (error) throw error;
      toast({ title: "Listing updated!" });
      navigate("/my-listings");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not update listing";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!validId) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Listing not found</div>;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-3">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return <QueryError message="Could not load listing" onRetry={() => refetch()} />;
  }

  if (listing && user && user.id !== listing.owner_id) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Not authorized</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Edit Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} maxLength={4000} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as (typeof LISTING_CATEGORIES)[number])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LISTING_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/my-listings")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditListing() {
  return (
    <RequireAuth>
      <EditListingForm />
    </RequireAuth>
  );
}
