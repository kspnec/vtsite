"use client";

import { useState } from "react";
import { SpaceAvatarDisplay } from "@/components/SpaceAvatar";

interface Props {
  photoUrl?: string | null;
  avatarKey?: string | null;
  name: string;
  initials: string;
}

export default function ProfilePhoto({ photoUrl, avatarKey, name, initials }: Props) {
  const [open, setOpen] = useState(false);

  const avatar = photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoUrl}
      alt={name}
      width={96}
      height={96}
      data-testid="profile-avatar"
      className="w-24 h-24 rounded-3xl object-cover border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10 cursor-pointer hover:scale-105 transition-transform"
      onClick={() => setOpen(true)}
    />
  ) : avatarKey ? (
    <div data-testid="profile-avatar" className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setOpen(true)}>
      <SpaceAvatarDisplay avatarKey={avatarKey} size={96} name={name} />
    </div>
  ) : (
    <div data-testid="profile-avatar" className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center border-2 border-white/10 shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => setOpen(true)}>
      <span className="text-white font-bold text-3xl">{initials}</span>
    </div>
  );

  return (
    <>
      {avatar}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-label="Profile photo viewer"
        >
          <div className="relative max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-slate-400 hover:text-white text-2xl font-light"
              aria-label="Close"
            >
              ✕
            </button>
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={name}
                className="w-full rounded-2xl shadow-2xl border border-white/10"
              />
            ) : avatarKey ? (
              <div className="flex justify-center">
                <SpaceAvatarDisplay avatarKey={avatarKey} size={256} name={name} />
              </div>
            ) : (
              <div className="w-64 h-64 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center border-2 border-white/10 shadow-2xl">
                <span className="text-white font-bold text-7xl">{initials}</span>
              </div>
            )}
            <p className="text-center text-slate-300 font-medium mt-4">{name}</p>
          </div>
        </div>
      )}
    </>
  );
}
