import { NextResponse } from "next/server";
import sharp from "sharp";

import {
  ACCEPTED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  PHOTO_STAGES,
  photoObjectPath,
} from "@/lib/photo";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EDGE = 768;

export interface PhotoUploadResponse {
  photo_path: string;
}

/**
 * Renders the uploaded photo into the blur ladder and stores every variant.
 *
 * The original is deliberately never kept: the sharpest thing in the bucket is
 * what someone sees after fifty messages, and there is no file anywhere that a
 * leak could turn into an un-blurred face the owner did not agree to.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json(
      { error: "Nu există o sesiune activă." },
      { status: 401 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Lipsește fotografia." }, { status: 422 });
  }
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type as (typeof ACCEPTED_PHOTO_TYPES)[number])) {
    return NextResponse.json(
      { error: "Acceptăm doar JPEG, PNG sau WebP." },
      { status: 415 },
    );
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { error: "Fotografia depășește 8 MB." },
      { status: 413 },
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  // One decode, reused for every variant. `rotate()` applies the EXIF
  // orientation before the metadata is dropped.
  let base: ReturnType<typeof sharp>;
  try {
    base = sharp(input, { failOn: "error" })
      .rotate()
      .resize(EDGE, EDGE, { fit: "cover", position: "attention" });
    await base.clone().metadata();
  } catch {
    return NextResponse.json(
      { error: "Fișierul nu pare să fie o imagine validă." },
      { status: 422 },
    );
  }

  const photoPath = auth.user.id;

  for (const stage of PHOTO_STAGES) {
    const pipeline = base.clone();
    // sigma 0 means the photo is through: no blur at all.
    const rendered = await (stage.sigma > 0 ? pipeline.blur(stage.sigma) : pipeline)
      .jpeg({ quality: stage.sigma > 0 ? 70 : 88, mozjpeg: true })
      .toBuffer();

    const { error } = await supabase.storage
      .from("faces")
      .upload(photoObjectPath(photoPath, stage.level), rendered, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("[photo] upload failed", error);
      return NextResponse.json(
        { error: "Nu am putut salva fotografia." },
        { status: 500 },
      );
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ photo_path: photoPath })
    .eq("id", auth.user.id);

  if (profileError) {
    return NextResponse.json(
      { error: "Fotografia s-a încărcat, dar profilul nu a fost actualizat." },
      { status: 500 },
    );
  }

  return NextResponse.json<PhotoUploadResponse>({ photo_path: photoPath });
}
