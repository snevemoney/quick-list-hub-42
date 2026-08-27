import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getListingImageUrl, LISTING_CATEGORIES } from "@/lib/listing";
import { formatListingPrice } from "@/lib/money";
import { PAGE_SIZE, sanitizeSearch } from "@/lib/validation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import { ListPager } from "@/components/ListPager";
import { Search, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CATEGORIES = ["All", ...LISTING_CATEGORIES];

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [search, category]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["listings", "public", page, category, search],
    queryFn: async () => {
      const term = sanitizeSearch(search);
      let q = supabase.from("listings").select("*").eq("paid", true).eq("status", "active");
      if (category !== "All") q = q.eq("category", category);
      if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      const from = page * PAGE_SIZE;
      const { data: rows, error } = await q
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE);
      if (error) throw error;
      const list = rows ?? [];
      return { rows: list.slice(0, PAGE_SIZE), hasMore: list.length > PAGE_SIZE };
    },
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Find what you need</h1>
        <p className="text-muted-foreground">Browse local listings near you</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <QueryError message="Could not load listings" onRetry={() => refetch()} />
      ) : !data?.rows.length ? (
        <div className="text-center py-20">
          <p className="text-lg text-muted-foreground">No listings found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search or category</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.rows.map((listing) => {
              const imgUrl = getListingImageUrl(listing);
              return (
                <Link key={listing.id} to={`/listing/${listing.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img
                        src={imgUrl}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="p-3">
                      <p className="font-semibold text-lg leading-tight">{formatListingPrice(listing.price)}</p>
                      <p className="text-sm text-foreground truncate mt-0.5">{listing.title}</p>
                      {listing.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {listing.city}
                        </p>
                      )}
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {listing.category}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
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
