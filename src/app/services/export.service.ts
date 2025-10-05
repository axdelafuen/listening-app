import { Injectable } from '@angular/core';
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

  constructor() { }

  async exportExercise(exerciseData: ExerciseData): Promise<void> {
    const zip = new JSZip();
    const exerciseTitle = this.sanitizeFileName(exerciseData.title || 'exercice-sans-titre');
    
    // Créer la structure de dossiers
    const assetsFolder = zip.folder('assets');
    const resultsFolder = zip.folder('results');

    // Préparer les données pour import.json
    const importData = await this.prepareImportData(exerciseData, assetsFolder!);
    
    // Générer les fichiers
    zip.file('import.json', JSON.stringify(importData, null, 2));
    zip.file('index.html', this.generateIndexHTML(importData));
    zip.file('script.js', this.generateScriptJS(importData)); // Passer les données au script
    
    // Créer un fichier readme dans results
    resultsFolder!.file('readme.txt', 'Les résultats des exercices seront sauvegardés dans ce dossier.');

    // Générer et télécharger le ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${exerciseTitle}.zip`);
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

      // Traiter l'image d'arrière-plan
      if (group.backgroundImage) {
        const imageExt = this.getFileExtension(group.backgroundImage.name);
        const imageName = `image_${imageCounter++}.${imageExt}`;
        assetsFolder.file(imageName, group.backgroundImage);
        groupData.backgroundImage = `assets/${imageName}`;
      }

      // Traiter les éléments audio
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

  private generateIndexHTML(importData: any): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${importData.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .title {
            font-size: 2.5rem;
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .instructions {
            font-size: 1.1rem;
            color: #7f8c8d;
        }

        .audio-elements-zone {
            text-align: center;
            margin: 30px 0;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .audio-elements-zone h3 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.3rem;
        }

        .audio-elements-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
            min-height: 100px;
            padding: 20px;
            border: 2px dashed #bdc3c7;
            border-radius: 8px;
            background-color: #f8f9fa;
        }

        .audio-element {
            padding: 12px 16px;
            background: #e3f2fd;
            border: 2px solid #2196f3;
            border-radius: 6px;
            cursor: grab;
            transition: all 0.3s ease;
            font-weight: 500;
            color: #1976d2;
            min-width: 120px;
            text-align: center;
            position: relative;
            user-select: none;
        }

        .audio-element:hover {
            background: #bbdefb;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        .audio-element.dragging {
            opacity: 0.7;
            cursor: grabbing;
            transform: rotate(5deg);
        }

        .audio-element.playing {
            background: #c8e6c9;
            border-color: #4caf50;
            color: #2e7d32;
        }

        .audio-element .play-icon {
            display: inline-block;
            margin-right: 8px;
            font-size: 14px;
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            transition: all 0.2s ease;
        }

        .audio-element .play-icon:hover {
            background: rgba(255, 255, 255, 0.4);
            transform: scale(1.1);
        }

        .audio-element .controls {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .groups-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }

        .group {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            min-height: 200px;
        }

        .group-header {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
        }

        .group-image {
            width: 120px;
            height: 120px;
            border-radius: 12px;
            object-fit: cover;
            border: 3px solid #e9ecef;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .drop-zone {
            min-height: 120px;
            border: 2px dashed #bdc3c7;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 15px;
            transition: all 0.3s ease;
        }

        .drop-zone.drag-over {
            border-color: #3498db;
            background-color: #ebf3fd;
        }

        .audio-slot {
            padding: 12px 16px;
            background: #f8f9fa;
            border: 2px dashed #bdc3c7;
            border-radius: 6px;
            text-align: center;
            color: #6c757d;
            transition: all 0.3s ease;
            min-width: 120px;
            min-height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .audio-slot.drag-over {
            border-color: #3498db;
            background-color: #ebf3fd;
            border-style: solid;
        }

        .audio-slot.filled {
            background: #6c757d;
            border: 2px solid #495057;
            color: white;
            border-style: solid;
        }

        .audio-slot.filled.correct {
            background: #28a745;
            border-color: #1e7e34;
        }

        .audio-slot.filled.incorrect {
            background: #dc3545;
            border-color: #bd2130;
        }

        .audio-slot.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .controls {
            text-align: center;
            margin: 30px 0;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin: 0 10px;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background: #3498db;
            color: white;
        }

        .btn-primary:hover {
            background: #2980b9;
        }

        .btn-success {
            background: #27ae60;
            color: white;
        }

        .btn-success:hover {
            background: #229954;
        }

        @media (max-width: 768px) {
            .groups-container {
                grid-template-columns: 1fr;
            }
            
            .title {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${importData.title}</h1>
            <p class="instructions">
                Glissez et déposez les éléments audio dans les bons groupes.
            </p>
        </div>

        <div class="audio-elements-zone">
            <h3>Éléments audio à placer</h3>
            <div class="audio-elements-container" id="audioElementsContainer">
                <!-- Les éléments audio seront générés dynamiquement -->
            </div>
            <audio id="audioElement" preload="auto"></audio>
        </div>

        <div class="controls">
            <button class="btn btn-success" id="validateBtn" style="display: none;">Valider</button>
        </div>

        <div class="groups-container" id="groupsContainer">
            <!-- Les groupes seront générés dynamiquement -->
        </div>

    </div>

    <script src="script.js"></script>
</body>
</html>`;
  }

  private generateScriptJS(importData: any): string {
    return `// Données de l'exercice incluses directement
const EXERCISE_DATA = ${JSON.stringify(importData, null, 2)};

class ListeningExercise {
    constructor() {
        this.importData = EXERCISE_DATA;
        this.allAudioElements = [];
        this.currentAudioIndex = 0;
        this.userPlacements = {};
        this.gameCompleted = false;
        this.currentlyPlaying = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.renderGroups();
        this.prepareAudioElements();
        this.showNextAudio();
    }

    setupEventListeners() {
        document.getElementById('validateBtn').addEventListener('click', () => this.validateAllAnswers());
        
        // Gestion du drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        // Événements pour les zones de dépôt (emplacements)
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dropZone = e.target.closest('.audio-slot');
            if (dropZone && !dropZone.classList.contains('filled')) {
                dropZone.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const dropZone = e.target.closest('.audio-slot');
            if (dropZone) {
                dropZone.classList.remove('drag-over');
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropZone = e.target.closest('.audio-slot');
            if (dropZone && !dropZone.classList.contains('filled')) {
                dropZone.classList.remove('drag-over');
                const audioId = e.dataTransfer.getData('text/plain');
                this.placeAudio(audioId, dropZone);
            }
        });
    }

    renderGroups() {
        const container = document.getElementById('groupsContainer');
        container.innerHTML = '';

        this.importData.groups.forEach(group => {
            const groupElement = this.createGroupElement(group);
            container.appendChild(groupElement);
        });
    }

    createGroupElement(group) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group';
        groupDiv.dataset.groupId = group.id;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'group-header';

        if (group.backgroundImage) {
            const img = document.createElement('img');
            img.src = group.backgroundImage;
            img.className = 'group-image';
            img.alt = \`Groupe \${group.id}\`;
            headerDiv.appendChild(img);
        }

        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.dataset.groupId = group.id;

        // Créer les emplacements pour les audios
        for (let i = 0; i < group.audioElements.length; i++) {
            const slot = document.createElement('div');
            slot.className = 'audio-slot';
            slot.dataset.groupId = group.id;
            slot.dataset.slotIndex = i;
            slot.textContent = \`Emplacement \${i + 1}\`;
            dropZone.appendChild(slot);
        }

        groupDiv.appendChild(headerDiv);
        groupDiv.appendChild(dropZone);

        return groupDiv;
    }

    prepareAudioElements() {
        // Collecter tous les éléments audio et les mélanger
        this.allAudioElements = [];
        this.importData.groups.forEach(group => {
            group.audioElements.forEach(audio => {
                this.allAudioElements.push({
                    ...audio,
                    correctGroupId: group.id
                });
            });
        });

        // Mélanger l'ordre des audios
        this.shuffleArray(this.allAudioElements);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    showNextAudio() {
        if (this.currentAudioIndex >= this.allAudioElements.length) {
            this.checkIfCompleted();
            return;
        }

        const audio = this.allAudioElements[this.currentAudioIndex];
        this.createAudioElement(audio);
        this.autoPlayAudio(audio);
    }

    createAudioElement(audioData) {
        const container = document.getElementById('audioElementsContainer');
        
        const audioElement = document.createElement('div');
        audioElement.className = 'audio-element';
        audioElement.draggable = true;
        audioElement.dataset.audioId = audioData.id;
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'controls';
        
        const playIcon = document.createElement('span');
        playIcon.className = 'play-icon';
        playIcon.textContent = '▶';
        playIcon.title = 'Jouer/Pause';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = audioData.originalName || \`Audio \${audioData.id}\`;
        
        controlsDiv.appendChild(playIcon);
        controlsDiv.appendChild(nameSpan);
        audioElement.appendChild(controlsDiv);

        // Événements de drag
        audioElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', audioData.id);
            audioElement.classList.add('dragging');
        });

        audioElement.addEventListener('dragend', () => {
            audioElement.classList.remove('dragging');
        });

        // Clic sur l'icône play pour jouer/pause l'audio
        playIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleAudio(audioData, playIcon);
        });

        container.appendChild(audioElement);
    }

    toggleAudio(audioData, playIcon) {
        const audioElement = document.getElementById('audioElement');
        
        // Si c'est le même audio qui joue actuellement
        if (audioElement.src.endsWith(audioData.fileName)) {
            if (audioElement.paused) {
                this.playAudio(audioData, playIcon);
            } else {
                this.pauseAudio(playIcon);
            }
        } else {
            // Jouer un nouvel audio
            this.playAudio(audioData, playIcon);
        }
    }

    playAudio(audioData, playIcon = null) {
        const audioElement = document.getElementById('audioElement');
        audioElement.src = audioData.fileName;

        // Réinitialiser tous les icônes play
        document.querySelectorAll('.play-icon').forEach(icon => {
            icon.textContent = '▶';
        });

        // Mettre à jour l'état visuel
        if (this.currentlyPlaying) {
            this.currentlyPlaying.classList.remove('playing');
        }

        const audioElementDiv = document.querySelector(\`[data-audio-id="\${audioData.id}"]\`);
        if (audioElementDiv) {
            audioElementDiv.classList.add('playing');
            this.currentlyPlaying = audioElementDiv;
        }

        if (playIcon) {
            playIcon.textContent = '⏸';
        }

        audioElement.play().catch(error => {
            console.error('Erreur lors de la lecture:', error);
        });

        audioElement.addEventListener('ended', () => {
            if (audioElementDiv) {
                audioElementDiv.classList.remove('playing');
            }
            if (playIcon) {
                playIcon.textContent = '▶';
            }
            this.currentlyPlaying = null;
        }, { once: true });
    }

    pauseAudio(playIcon) {
        const audioElement = document.getElementById('audioElement');
        audioElement.pause();
        
        if (playIcon) {
            playIcon.textContent = '▶';
        }
        
        if (this.currentlyPlaying) {
            this.currentlyPlaying.classList.remove('playing');
        }
    }

    autoPlayAudio(audioData) {
        // Jouer automatiquement l'audio quand il apparaît
        setTimeout(() => {
            const playIcon = document.querySelector(\`[data-audio-id="\${audioData.id}"] .play-icon\`);
            this.playAudio(audioData, playIcon);
        }, 500);
    }

    placeAudio(audioId, slotElement) {
        const audioData = this.allAudioElements.find(a => a.id === audioId);
        if (!audioData) return;

        const groupId = slotElement.dataset.groupId;
        const slotIndex = slotElement.dataset.slotIndex;

        // Enregistrer le placement
        this.userPlacements[audioId] = {
            groupId: groupId,
            slotIndex: slotIndex,
            correctGroupId: audioData.correctGroupId,
            audioData: audioData
        };

        // Mettre à jour l'interface
        slotElement.textContent = audioData.originalName || \`Audio \${audioData.id}\`;
        slotElement.classList.add('filled');

        // Supprimer l'élément audio draggable
        const audioElement = document.querySelector(\`[data-audio-id="\${audioId}"]\`);
        if (audioElement) {
            audioElement.remove();
        }

        // Passer à l'audio suivant
        this.currentAudioIndex++;
        setTimeout(() => {
            this.showNextAudio();
        }, 1000);
    }

    checkIfCompleted() {
        const totalAudios = this.allAudioElements.length;
        const placedAudios = Object.keys(this.userPlacements).length;

        if (placedAudios === totalAudios) {
            // Tous les audios sont placés, afficher le bouton de validation
            document.getElementById('validateBtn').style.display = 'inline-block';
            
            // Griser tous les emplacements
            document.querySelectorAll('.audio-slot.filled').forEach(slot => {
                slot.classList.add('disabled');
            });
        }
    }

    validateAllAnswers() {
        let correctAnswers = 0;
        const totalAnswers = Object.keys(this.userPlacements).length;

        // Vérifier chaque placement et mettre à jour l'affichage
        Object.entries(this.userPlacements).forEach(([audioId, placement]) => {
            const isCorrect = placement.groupId == placement.correctGroupId;
            const slot = document.querySelector(\`[data-group-id="\${placement.groupId}"][data-slot-index="\${placement.slotIndex}"]\`);

            if (slot) {
                slot.classList.remove('disabled');
                if (isCorrect) {
                    slot.classList.add('correct');
                    correctAnswers++;
                } else {
                    slot.classList.add('incorrect');
                }
            }
        });

        // Afficher les résultats finaux
        const percentage = Math.round((correctAnswers / totalAnswers) * 100);
        setTimeout(() => {
            alert(\`Exercice terminé !\\nScore: \${correctAnswers}/\${totalAnswers} (\${percentage}%)\`);
        }, 1000);

        // Cacher le bouton de validation
        document.getElementById('validateBtn').style.display = 'none';
        
        this.gameCompleted = true;
    }
}

// Initialiser l'exercice quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    window.exercise = new ListeningExercise();
});`;
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }
}
