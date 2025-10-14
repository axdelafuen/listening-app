import { Injectable } from '@angular/core';
import JSZip from 'jszip';

interface ImportedAudioElement {
  id: number;
  file: File | null;
  fileName: string;
}

interface ImportedExerciseGroup {
  id: number;
  backgroundImage: File | null;
  backgroundImageName: string;
  backgroundImageUrl: string;
  audioElements: ImportedAudioElement[];
}

export interface ImportedExerciseData {
  title: string;
  groups: ImportedExerciseGroup[];
}

@Injectable({ providedIn: 'root' })
export class ImportService {
  private importedExercise: ImportedExerciseData | null = null;

  hasImportedExercise(): boolean {
    return this.importedExercise !== null;
  }

  consumeImportedExercise(): ImportedExerciseData | null {
    const data = this.importedExercise;
    this.importedExercise = null;
    return data;
  }

  async importFromZip(file: File): Promise<void> {
    const zip = await JSZip.loadAsync(file);

    const importEntry = zip.file('import.json');
    if (!importEntry) {
      throw new Error('Fichier import.json introuvable dans l’archive');
    }
    const importJsonText = await importEntry.async('text');
    let manifest: any;
    try {
      manifest = JSON.parse(importJsonText);
    } catch {
      throw new Error('import.json invalide');
    }

    const groups: ImportedExerciseGroup[] = [];
    for (const g of manifest.groups || []) {
      let bgFile: File | null = null;
      let bgUrl = '';
      let bgName = '';
      if (g.backgroundImage) {
        const path = g.backgroundImage.replace(/^\.\/?/, '');
        const fileInZip = zip.file(path.replace('assets/', 'assets/'));
        if (fileInZip) {
          const blob = await fileInZip.async('blob');
          const ext = this.extractExtension(path) || 'png';
            bgName = this.deriveOriginalName(path, 'image_', ext);
          bgFile = new File([blob], bgName, { type: blob.type || this.guessMime(ext) });
          bgUrl = URL.createObjectURL(blob);
        }
      }

      const audioElements: ImportedAudioElement[] = [];
      for (const a of g.audioElements || []) {
        const path = (a.fileName || '').replace(/^\.\/?/, '');
        const fileInZip = zip.file(path);
        if (fileInZip) {
          const blob = await fileInZip.async('blob');
          const ext = this.extractExtension(path) || 'mp3';
          const originalName = a.originalName || this.deriveOriginalName(path, 'audio_', ext);
          const audioFile = new File([blob], originalName, { type: blob.type || this.guessMime(ext) });
          audioElements.push({
            id: a.id,
            file: audioFile,
            fileName: originalName
          });
        } else {
          audioElements.push({ id: a.id, file: null, fileName: a.originalName || 'Audio manquant' });
        }
      }

      groups.push({
        id: g.id,
        backgroundImage: bgFile,
        backgroundImageName: bgName,
        backgroundImageUrl: bgUrl,
        audioElements
      });
    }

    this.importedExercise = {
      title: manifest.title || 'Exercice importé',
      groups
    };
  }

  private extractExtension(path: string): string {
    const parts = path.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  private deriveOriginalName(path: string, prefix: string, ext: string): string {
    const base = path.split('/').pop() || (prefix + Date.now());
    return base.includes('.') ? base : base + '.' + ext;
  }

  private guessMime(ext: string): string {
    switch (ext) {
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      case 'mp3': return 'audio/mpeg';
      case 'wav': return 'audio/wav';
      case 'ogg': return 'audio/ogg';
      default: return 'application/octet-stream';
    }
  }
}
