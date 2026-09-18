import { supabase } from "@/integrations/supabase/client";

const maxFileSize = 20 * 1024 * 1024;

export async function prepareProfileImage(file: File): Promise<Blob> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const supportedExtensions = new Set(["jpg", "jpeg", "jfif", "png", "webp", "heic", "heif"]);
  if (!file.type.startsWith("image/") && !supportedExtensions.has(extension ?? "")) {
    throw new Error("Escolha uma foto JPG, PNG, WEBP, HEIC ou HEIF.");
  }
  if (file.size > maxFileSize) throw new Error("A foto deve ter no máximo 20 MB.");

  const sourceFile = await convertHeicImage(file);
  const image = await loadImage(sourceFile);
  const maxSize = 900;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível processar a foto.");
  context.drawImage(image, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível processar a foto."))),
      "image/jpeg",
      0.78,
    );
  });
}

export async function uploadProfileImage(file: File, objectKey = "profile"): Promise<string> {
  const blob = await prepareProfileImage(file);
  if (!supabase) return blobToDataUrl(blob);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Faça login novamente para alterar sua foto.");

  const safeObjectKey = objectKey.replace(/[^a-zA-Z0-9_-]/g, "-");
  const path = `${authData.user.id}/${safeObjectKey}.jpg`;
  const { error } = await supabase.storage
    .from("profile-images")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(`Não foi possível enviar a foto: ${error.message}`);

  const { data } = supabase.storage.from("profile-images").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

async function convertHeicImage(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mightBeHeic =
    extension === "heic" ||
    extension === "heif" ||
    file.type === "image/heic" ||
    file.type === "image/heif";
  if (!mightBeHeic) return file;

  try {
    const { heicTo, isHeic } = await import("heic-to/csp");
    if (!(await isHeic(file))) {
      throw new Error("O arquivo selecionado não contém uma imagem HEIC ou HEIF válida.");
    }
    return await heicTo({ blob: file, type: "image/jpeg", quality: 0.88 });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Não foi possível converter a foto do iPhone: ${error.message}`
        : "Não foi possível converter a foto do iPhone.",
    );
  }
}

function loadImage(file: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Formato de imagem não suportado."));
    };
    image.src = url;
  });
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a foto."));
    reader.readAsDataURL(blob);
  });
}
