import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface AudioElement {
  id: number;
  file: File | null;
  fileName: string;
}

interface ExerciseGroup {
  id: number;
  backgroundImage: File | null;
  backgroundImageName: string;
  backgroundImageUrl: string;
  audioElements: AudioElement[];
}

interface ExerciseData {
  title: string;
  groups: ExerciseGroup[];
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor(private http: HttpClient) { }

  async exportExercise(exerciseData: ExerciseData): Promise<void> {
    const zip = new JSZip();
    const exerciseTitle = this.sanitizeFileName(exerciseData.title || 'exercice-sans-titre');
    
    const assetsFolder = zip.folder('assets');

    const importData = await this.prepareImportData(exerciseData, assetsFolder!);
    
    await this.copyStaticTemplates(zip);
    
    const exerciseDataJS = this.generateExerciseDataJS(importData);
    zip.file('exercise-data.js', exerciseDataJS);

    zip.file('import.json', JSON.stringify(importData, null, 2));

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${exerciseTitle}.zip`);
  }

  private async copyStaticTemplates(zip: JSZip): Promise<void> {
    try {
      const indexHtml = await this.http.get('assets/templates/index.html', { responseType: 'text' }).toPromise();
      if (indexHtml) {
        zip.file('index.html', indexHtml);
      }

      const stylesCss = await this.http.get('assets/templates/styles.css', { responseType: 'text' }).toPromise();
      if (stylesCss) {
        zip.file('styles.css', stylesCss);
      }

      const exerciseEngineJS = await this.http.get('assets/templates/exercise-engine.js', { responseType: 'text' }).toPromise();
      if (exerciseEngineJS) {
        zip.file('exercise-engine.js', exerciseEngineJS);
      }
    } catch (error) {
      console.error('Erreur lors de la copie des templates:', error);
      throw new Error('Impossible de charger les templates statiques');
    }
  }

  private generateExerciseDataJS(importData: any): string {
    return `const EXERCISE_DATA = ${JSON.stringify(importData, null, 2)};`;
  }

  private async prepareImportData(exerciseData: ExerciseData, assetsFolder: JSZip): Promise<any> {
    const groups = [];
    let audioCounter = 0;
    let imageCounter = 0;

    for (const group of exerciseData.groups) {
      const groupData: any = {
        id: group.id,
        backgroundImage: null,
        audioElements: []
      };

      if (group.backgroundImage) {
        const imageExt = this.getFileExtension(group.backgroundImage.name);
        const imageName = `image_${imageCounter++}.${imageExt}`;
        assetsFolder.file(imageName, group.backgroundImage);
        groupData.backgroundImage = `assets/${imageName}`;
      }

      for (const audioElement of group.audioElements) {
        if (audioElement.file) {
          const audioExt = this.getFileExtension(audioElement.file.name);
          const audioName = `audio_${audioCounter++}.${audioExt}`;
          assetsFolder.file(audioName, audioElement.file);
          
          groupData.audioElements.push({
            id: audioElement.id,
            fileName: `assets/${audioName}`,
            originalName: audioElement.fileName
          });
        }
      }

      groups.push(groupData);
    }

    return {
      title: exerciseData.title,
      groups: groups,
      generatedAt: new Date().toISOString()
    };
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }
}
