import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, RequireAuth } from "@/lib/auth";
import { LISTING_CATEGORIES } from "@/lib/listing";
import { centsToDollarString, parseDollarInputToCents } from "@/lib/money";
import {
  imageExtension,
  listingFormSchema,
  MAX_LISTING_IMAGES,
  validateListingImage,
} from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function CreateListingForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<(typeof LISTING_CATEGORIES)[number]>("Other");
  const [city, setCity] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = "";
    const next: File[] = [];
    for (const file of selected) {
      if (files.length + next.length >= MAX_LISTING_IMAGES) {
        toast({ title: "Too many photos", description: `Maximum ${MAX_LISTING_IMAGES} images`, variant: "destructive" });
        break;
      }
      const invalid = validateListingImage(file);
      if (invalid) {
        toast({ title: "Invalid image", description: invalid, variant: "destructive" });
        continue;
      }
      next.push(file);
    }
    if (!next.length) return;
    setFiles((prev) => [...prev, ...next]);
    next.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
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
      const imagePaths: string[] = [];
      for (const file of files) {
        const ext = imageExtension(file);
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("listing-images").upload(path, file);
        if (error) throw error;
        imagePaths.push(path);
      }

      const { data, error } = await supabase
        .from("listings")
        .insert({
          owner_id: user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          price: Number(centsToDollarString(cents)),
          category: parsed.data.category,
          city: parsed.data.city || null,
          images: imagePaths,
        })
        .select("id")
        .single();

      if (error) throw error;
      navigate(`/pay/${data.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not create listing";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Create Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
                placeholder="What are you selling?"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                maxLength={4000}
                placeholder="Describe your item..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  placeholder="0.00"
                />
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
              <Label>City (optional)</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} placeholder="Your city" />
            </div>

            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {files.length < MAX_LISTING_IMAGES && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-input flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Add</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={handleFiles} />
                  </label>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create & Continue to Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateListing() {
  return (
    <RequireAuth>
      <CreateListingForm />
    </RequireAuth>
  );
}
