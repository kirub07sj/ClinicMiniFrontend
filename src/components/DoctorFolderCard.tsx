import React from 'react';
import { DoctorWithCount } from '../types';
import { cn } from '../utils/cn';
import activeFolder from '../assets/ActiveFolder.png';
import normalFolder from '../assets/NormalFolder.png';

interface Props {
  doctor: DoctorWithCount;
  /** Renders the blue "active" folder art with light text (most-available doctor). */
  active?: boolean;
  /** Makes the card clickable (used in the registration modal). */
  selectable?: boolean;
  /** Selected state for the selectable variant — also shows the blue art. */
  selected?: boolean;
  onSelect?: () => void;
}

const getInitials = (name: string): string =>
  name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

/**
 * A folder-shaped doctor availability card. The blue `ActiveFolder` art is used
 * for the most-available doctor (fewest assigned patients) or the selected doctor
 * in the registration modal; everyone else uses the gray `NormalFolder` art.
 * The PNG is rendered as an <img> so the card keeps the artwork's aspect ratio,
 * and all text is overlaid with percentage positioning tuned to the artwork.
 */
export const DoctorFolderCard: React.FC<Props> = ({
  doctor,
  active = false,
  selectable = false,
  selected = false,
  onSelect,
}) => {
  const isBlue = active || selected;
  const folderArt = isBlue ? activeFolder : normalFolder;
  const nameColor = isBlue ? 'text-white' : 'text-slate-700';
  const subColor = isBlue ? 'text-white/80' : 'text-slate-500';

  const content = (
    <>
      <img
        src={folderArt}
        alt=""
        draggable={false}
        className="block w-full h-auto select-none pointer-events-none"
      />

      {/* Initials sitting inside the artwork's white circle */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: '6%', top: '12%', width: '32%', height: '40%' }}
      >
        <span className="font-extrabold text-slate-400 text-base sm:text-lg leading-none">
          {getInitials(doctor.name)}
        </span>
      </div>

      {/* Name + role */}
      <div className="absolute" style={{ left: '42%', top: '22%', right: '6%' }}>
        <p className={cn('font-bold leading-tight truncate text-xs sm:text-sm', nameColor)}>
          Dr. {doctor.name}
        </p>
        <p className={cn('text-[9px] sm:text-[10px] leading-tight mt-0.5', subColor)}>
          Currently Assigned
        </p>
      </div>

      {/* "Number of Assigned Patients" label */}
      <div className="absolute" style={{ left: '8%', bottom: '13%', maxWidth: '52%' }}>
        <p className={cn('text-[9px] sm:text-[10px] leading-tight', subColor)}>
          Number of
          <br />
          Assigned Patients
        </p>
      </div>

      {/* Count sitting over the artwork's small rounded square */}
      <div
        className="absolute flex items-center justify-center"
        style={{ right: '6.5%', bottom: '11%', width: '17%', height: '24%' }}
      >
        <span
          className={cn(
            'font-extrabold text-sm sm:text-base leading-none',
            isBlue ? 'text-white' : 'text-slate-600'
          )}
        >
          {doctor.activePatientCount}
        </span>
      </div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'relative block w-full text-left rounded-2xl transition-transform focus:outline-none',
          'hover:scale-[1.02]',
          selected && 'ring-2 ring-sky-500 ring-offset-2'
        )}
      >
        {content}
      </button>
    );
  }

  return <div className="relative w-full">{content}</div>;
};

export default DoctorFolderCard;
