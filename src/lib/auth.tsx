import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function AuthSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only set local state inside the callback — never make async
    // Supabase calls here; it deadlocks the internal auth lock.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      })
      .catch(() => {
        setSession(null);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  // Ensure profile row exists — runs outside the auth lock.
  // Uses upsert to handle races and retries gracefully.
  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;
    const name = session.user.email?.split("@")[0] || "User";
    supabase
      .from("profiles")
      .upsert({ id: uid, display_name: name }, { onConflict: "id", ignoreDuplicates: true })
      .then(({ error }) => {
        if (error) console.error("Profile upsert failed", error.message);
      });
  }, [session?.user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) return <AuthSpinner />;
  if (!user) return null;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const {
    data: isAdmin,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", user!.id).single();
      if (error) throw error;
      return !!data?.is_admin;
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || (user && isLoading)) return <AuthSpinner />;
  if (!user || isError || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Not authorized</div>
    );
  }
  return <>{children}</>;
}
