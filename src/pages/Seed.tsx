import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, RequireAuth } from "@/lib/auth";

const SEED_KEY = "quickmarket_seed_done";

const seedListing = {
  title: "Vintage Leather Backpack",
  description:
    "Beautiful handcrafted vintage leather backpack in great condition. Perfect for everyday use or travel. Brown distressed leather with brass hardware.",
  price: 45,
  category: "Clothing",
  city: "Portland",
  images: [],
  status: "active",
  paid: true,
};

function SeedContent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      if (sessionStorage.getItem(SEED_KEY)) {
        navigate("/my-listings", { replace: true });
        return;
      }
      const { error } = await supabase.from("listings").insert({
        owner_id: user.id,
        ...seedListing,
      });
      sessionStorage.setItem(SEED_KEY, "1");
      navigate("/my-listings", { replace: true });
    };
    run();
  }, [user, navigate]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-muted-foreground">Restoring demo listing…</p>
    </div>
  );
}

export default function Seed() {
  return (
    <RequireAuth>
      <SeedContent />
    </RequireAuth>
  );
}
