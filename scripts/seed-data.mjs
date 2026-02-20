import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://worggtodbdjldaipbtba.supabase.co";
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard or: supabase projects api-keys)");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

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

async function main() {
  const email = process.env.SEED_EMAIL || "sneve1@example.com";
  const password = process.env.SEED_PASSWORD || "password123";

  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "sneve1" },
  });

  if (createError) {
    if (createError.message.includes("already been registered")) {
      const { data: list } = await supabase.from("listings").select("id").limit(1);
      if (list?.length) {
        console.log("User and listing already exist.");
      } else {
        const { data: users } = await supabase.auth.admin.listUsers();
        const u = users?.users?.find((x) => x.email === email);
        if (u) {
          await supabase.from("listings").insert({ owner_id: u.id, ...seedListing });
          console.log("Added Vintage Leather Backpack for existing user.");
        }
      }
    } else {
      console.error("Create user error:", createError.message);
      process.exit(1);
    }
  } else if (userData?.user) {
    await supabase.from("profiles").upsert(
      { id: userData.user.id, display_name: "sneve1" },
      { onConflict: "id" }
    );
    await supabase.from("listings").insert({ owner_id: userData.user.id, ...seedListing });
    console.log("Created user and Vintage Leather Backpack listing.");
  }

  console.log("\nSign in at http://localhost:8080/auth with:");
  console.log("  Email:", email);
  console.log("  Password:", password);
}

main();
