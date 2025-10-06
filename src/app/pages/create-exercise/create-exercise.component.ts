import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ExportService } from '../../services/export/export.service';

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

@Component({
  selector: 'app-create-exercise',
  templateUrl: './create-exercise.component.html',
  styleUrls: ['./create-exercise.component.css']
})
export class CreateExerciseComponent {
  exerciseTitle: string = '';
  groups: ExerciseGroup[] = [];
  private nextGroupId = 1;
  private nextAudioId = 1;
  

  showExitPopup = false;
  isSaved = false;

  constructor(private router: Router, private exportService: ExportService) {}


  addGroup() {
    const newGroup: ExerciseGroup = {
      id: this.nextGroupId++,
      backgroundImage: null,
      backgroundImageName: '',
      backgroundImageUrl: '',
      audioElements: []
    };
    this.groups.push(newGroup);
  }


  addAudioElement(groupId: number) {
    const group = this.groups.find(g => g.id === groupId);
    if (group) {
      const newAudio: AudioElement = {
        id: this.nextAudioId++,
        file: null,
        fileName: ''
      };
      group.audioElements.push(newAudio);
    }
  }


  onBackgroundImageChange(event: any, groupId: number) {
    const file = event.target.files[0];
    const group = this.groups.find(g => g.id === groupId);
    if (group && file) {
      if (group.backgroundImageUrl) {
        URL.revokeObjectURL(group.backgroundImageUrl);
      }
      
      group.backgroundImage = file;
      group.backgroundImageName = file.name;
      group.backgroundImageUrl = URL.createObjectURL(file);
    }
  }


  onAudioFileChange(event: any, groupId: number, audioId: number) {
    const file = event.target.files[0];
    const group = this.groups.find(g => g.id === groupId);
    if (group) {
      const audioElement = group.audioElements.find(a => a.id === audioId);
      if (audioElement && file) {
        audioElement.file = file;
        audioElement.fileName = file.name;
      }
    }
  }


  removeGroup(groupId: number) {
    const group = this.groups.find(g => g.id === groupId);
    if (group && group.backgroundImageUrl) {
      URL.revokeObjectURL(group.backgroundImageUrl);
    }
    this.groups = this.groups.filter(g => g.id !== groupId);
  }


  removeAudioElement(groupId: number, audioId: number) {
    const group = this.groups.find(g => g.id === groupId);
    if (group) {
      group.audioElements = group.audioElements.filter(a => a.id !== audioId);
    }
  }

  getTotalAudioElements(): number {
    return this.groups.reduce((total, group) => total + group.audioElements.length, 0);
  }


  attemptGoBack() {
    if (this.hasUnsavedChanges()) {
      this.showExitPopup = true;
    } else {
      this.goBackToHome();
    }
  }


  hasUnsavedChanges(): boolean {
    return !this.isSaved && (this.exerciseTitle.trim() !== '' || this.groups.length > 0);
  }


  goBackToHome() {
    this.router.navigate(['/']);
  }


  closeExitPopup() {
    this.showExitPopup = false;
  }


  saveAndGoBack() {
    this.saveExercise();
    setTimeout(() => {
      this.goBackToHome();
    }, 1000);
  }

  async saveExercise() {
    if (this.groups.length === 0) {
      alert('Veuillez ajouter au moins un groupe avant d\'exporter.');
      return;
    }

    const hasAudios = this.groups.some(group => 
      group.audioElements.some(audio => audio.file !== null)
    );

    if (!hasAudios) {
      alert('Veuillez ajouter au moins un fichier audio avant d\'exporter.');
      return;
    }

    try {
      const exerciseData = {
        title: this.exerciseTitle,
        groups: this.groups
      };

      await this.exportService.exportExercise(exerciseData);
      alert('Exercice exporté avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export de l\'exercice.');
    }
  }
}
