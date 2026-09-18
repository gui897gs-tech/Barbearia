import { supabase } from "@/integrations/supabase/client";
import { blobToDataUrl, prepareProfileImage } from "@/shared/images/profile-image";

export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const blob = await prepareProfileImage(file);
  if (!supabase) return blobToDataUrl(blob);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Faça login novamente para enviar a foto.");

  const safeProductId = productId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const path = `${authData.user.id}/${safeProductId}.jpg`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(`Não foi possível enviar a foto: ${error.message}`);

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
