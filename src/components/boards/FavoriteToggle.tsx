"use client";

import { toggleFavorite } from "@/app/boards/actions";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import React from "react";

export default function FavoriteToggle({ id, isFavorite, size = "icon" as const }: { id: string; isFavorite?: boolean; size?: "icon" | "sm" | "default" }) {
  // Prevent card link navigation when toggling inside links
  const onClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
  };
  const [localFav, setLocalFav] = React.useState(!!isFavorite);
  const formAction = async (fd: FormData) => {
    await toggleFavorite(fd);
    try { if (typeof window !== "undefined") window.location.reload(); } catch {}
  };
  return (
    <form action={formAction} onClick={(e) => e.stopPropagation()}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant={localFav ? "secondary" : "ghost"} size={size} onClick={(e) => { onClick(e); setLocalFav((v) => !v); }} title={localFav ? "Unfavorite" : "Favorite"}>
        <Heart className={localFav ? "text-red-500 fill-red-500" : ""} />
      </Button>
    </form>
  );
}
