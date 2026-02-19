import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, RequireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function PayListingForm() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: listing } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      // Mark listing as paid
      const { error: updateError } = await supabase
        .from("listings")
        .update({ paid: true })
        .eq("id", id!);
      if (updateError) throw updateError;

      // Create payment record
      const { error: payError } = await supabase.from("payments").insert({
        user_id: user!.id,
        listing_id: id!,
        amount: 5,
        currency: "usd",
        status: "paid_demo",
      });
      if (payError) throw payError;
    },
    onSuccess: () => {
      toast({ title: "Payment successful!", description: "Your listing is now live." });
      navigate("/my-listings");
    },
  });

  if (listing?.paid) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-sm text-center">
        <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Already Paid</h2>
        <p className="text-muted-foreground mb-4">This listing is live.</p>
        <Button onClick={() => navigate("/my-listings")}>Go to My Listings</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-sm">
      <Card>
        <CardHeader className="text-center">
          <CreditCard className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle>Publish Your Listing</CardTitle>
          <CardDescription>Pay a one-time listing fee to make your listing visible to buyers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {listing && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{listing.title}</p>
              <p className="text-muted-foreground">${Number(listing.price).toFixed(0)}</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-3xl font-bold">$5.00</p>
            <p className="text-xs text-muted-foreground">One-time listing fee</p>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={() => payMutation.mutate()}
            disabled={payMutation.isPending}
          >
            {payMutation.isPending ? "Processing..." : "Pay $5 (Demo)"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            This is a demo payment. No real charges will be made.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PayListing() {
  return (
    <RequireAuth>
      <PayListingForm />
    </RequireAuth>
  );
}
