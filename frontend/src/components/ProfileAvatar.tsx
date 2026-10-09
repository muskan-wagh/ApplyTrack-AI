import { Avatar, AvatarFallback as RadixFallback } from '@/components/ui/avatar';
import {
  AvatarExtended,
  AvatarIndicator,
  AvatarRing,
} from '@/components/spaceui/avatar-extended';

/**
 * Profile avatar built on Space UI's Avatar Extended primitives.
 * Uses local initials fallback by default (offline-first) instead of the
 * external avatars.spaceui.one image API to avoid a network dependency in
 * the header. Pass `photoUrl` to opt into a real photo.
 */
export function ProfileAvatar({
  initials = 'AT',
  photoUrl,
  online = true,
}: {
  initials?: string;
  photoUrl?: string;
  online?: boolean;
}) {
  return (
    <AvatarExtended aria-label="Profile">
      <Avatar>
        {photoUrl ? (
          <img src={photoUrl} alt="Profile" className="aspect-square h-full w-full" />
        ) : null}
        <RadixFallback>{initials}</RadixFallback>
      </Avatar>
      <AvatarRing className="ring-indigo-200" />
      <AvatarIndicator className={online ? 'bg-emerald-500' : 'bg-slate-300'} />
    </AvatarExtended>
  );
}
