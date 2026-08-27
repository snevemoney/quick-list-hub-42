import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_EMAIL;
const password = process.env.SEED_PASSWORD;

const missing = [
  !url && "VITE_SUPABASE_URL",
  !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
  !email && "SEED_EMAIL",
  !password && "SEED_PASSWORD",
].filter(Boolean);

if (missing.length) {
  console.error(`Missing required env: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "sneve1" },
  });

  if (createError) {
    if (!createError.message.includes("already been registered")) {
      console.error("Create user error:", createError.message);
      process.exit(1);
    }

    const { data: list, error: listError } = await supabase.from("listings").select("id").limit(1);
    if (listError) {
      console.error("List listings error:", listError.message);
      process.exit(1);
    }
    if (list?.length) {
      console.log("User and listing already exist.");
      return;
    }

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error("List users error:", usersError.message);
      process.exit(1);
    }
    const u = users?.users?.find((x) => x.email === email);
    if (!u) {
      console.error("Existing user not found for SEED_EMAIL");
      process.exit(1);
    }
    const { error: insertError } = await supabase.from("listings").insert({ owner_id: u.id, ...seedListing });
    if (insertError) {
      console.error("Insert listing error:", insertError.message);
      process.exit(1);
    }
    console.log("Added Vintage Leather Backpack for existing user.");
    return;
  }

  if (!userData?.user) {
    console.error("Create user returned no user");
    process.exit(1);
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    { id: userData.user.id, display_name: "sneve1" },
    { onConflict: "id" }
  );
  if (profileError) {
    console.error("Profile upsert error:", profileError.message);
    process.exit(1);
  }

  const { error: insertError } = await supabase
    .from("listings")
    .insert({ owner_id: userData.user.id, ...seedListing });
  if (insertError) {
    console.error("Insert listing error:", insertError.message);
    process.exit(1);
  }
  console.log("Created user and Vintage Leather Backpack listing.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
