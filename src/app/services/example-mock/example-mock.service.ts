import { Injectable } from '@angular/core';
import { ExerciseData } from '../../models/exercise.model';

@Injectable({ providedIn: 'root' })
export class ExampleMockService {
  private readonly placeholderAudio = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

  generateMock(groupCount: number = 3, audiosPerGroup: number = 2): ExerciseData {
    const groups = Array.from({ length: groupCount }).map((_, gIndex) => {
      const audioElements = Array.from({ length: audiosPerGroup }).map((_, aIndex) => {
        const id = gIndex * audiosPerGroup + aIndex + 1;
        return {
          id,
          fileName: this.placeholderAudio,
          originalName: `Son ${String.fromCharCode(65 + gIndex)}${aIndex + 1}`
        };
      });
      return {
        id: gIndex + 1,
        backgroundImage: null,
        audioElements
      };
    });

    return {
      title: 'Exemple d\'exercice d\'écoute',
      groups
    };
  }
}
