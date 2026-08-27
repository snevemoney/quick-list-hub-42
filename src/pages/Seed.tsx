import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin, useAuth } from "@/lib/auth";
import { SEED_LISTING } from "@/lib/listing";
import { QueryError } from "@/components/QueryError";

const SEED_KEY = "quickmarket_seed_done";

function SeedContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const run = async () => {
      if (sessionStorage.getItem(SEED_KEY)) {
        navigate("/my-listings", { replace: true });
        return;
      }
      const { error: insertError } = await supabase.from("listings").insert({
        owner_id: user.id,
        ...SEED_LISTING,
      });
      if (cancelled) return;
      if (insertError) {
        setError(insertError.message || "Could not restore demo listing");
        return;
      }
      sessionStorage.setItem(SEED_KEY, "1");
      navigate("/my-listings", { replace: true });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user, navigate, attempt]);

  if (error) {
    return (
      <QueryError
        message={error}
        onRetry={() => {
          sessionStorage.removeItem(SEED_KEY);
          setError(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-muted-foreground">Restoring demo listing…</p>
    </div>
  );
}

export default function Seed() {
  return (
    <RequireAdmin>
      <SeedContent />
    </RequireAdmin>
  );
}
