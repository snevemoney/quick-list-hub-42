import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Plus, User, MessageSquare, LayoutList, Shield, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
            Quick<span className="text-primary">Market</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Button variant="default" size="sm" onClick={() => navigate("/create")}>
                  <Plus className="h-4 w-4 mr-1" /> Post Listing
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/my-listings")}>
                  <LayoutList className="h-4 w-4 mr-1" /> My Listings
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/messages")}>
                  <MessageSquare className="h-4 w-4 mr-1" /> Messages
                </Button>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate("/auth")}>Sign In</Button>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t bg-card px-4 py-3 space-y-2">
            {user ? (
              <>
                <Button variant="default" size="sm" className="w-full justify-start" onClick={() => { navigate("/create"); setMenuOpen(false); }}>
                  <Plus className="h-4 w-4 mr-2" /> Post Listing
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { navigate("/my-listings"); setMenuOpen(false); }}>
                  <LayoutList className="h-4 w-4 mr-2" /> My Listings
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { navigate("/messages"); setMenuOpen(false); }}>
                  <MessageSquare className="h-4 w-4 mr-2" /> Messages
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { signOut(); setMenuOpen(false); }}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </>
            ) : (
              <Button size="sm" className="w-full" onClick={() => { navigate("/auth"); setMenuOpen(false); }}>Sign In</Button>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
