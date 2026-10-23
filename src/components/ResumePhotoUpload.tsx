import { useId, useState } from 'react';
import type { PersonalInfo } from '../types/resume';

export default function ResumePhotoUpload({ personalInfo, onChange }: {
  personalInfo: PersonalInfo;
  onChange: (photo: string) => void;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File) {
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.');
      return;
    }
    setBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 320;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image processing unavailable');
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, 320, 320);
      context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 320, 320);
      onChange(canvas.toDataURL('image/jpeg', 0.85));
    } catch {
      setError('This image could not be added. Try another image.');
    } finally {
      URL.revokeObjectURL(url);
      setBusy(false);
    }
  }

  return (
    <div className="input-group">
      <label className="input-label" htmlFor={id}>Resume photo (optional)</label>
      {personalInfo.photo && (
        <img src={personalInfo.photo} alt="Resume photo" width={80} height={80}
          style={{ objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
      )}
      <input id={id} type="file" className="input-field" accept="image/jpeg,image/png,image/webp"
        disabled={busy} aria-busy={busy} aria-describedby={`${id}-help`} aria-invalid={Boolean(error)}
        onChange={event => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) void upload(file);
        }} />
      <p id={`${id}-help`} className="text-xs text-tertiary">
        JPG, PNG, or WebP, up to 5 MB. Photos are cropped to a square and included in your PDF.
      </p>
      <p role="status" className="text-sm">{busy ? 'Adding photo…' : ''}</p>
      {error && <p role="alert" className="text-sm">{error}</p>}
      {personalInfo.photo && (
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { onChange(''); setError(''); }}>
          Remove photo
        </button>
      )}
    </div>
  );
}
