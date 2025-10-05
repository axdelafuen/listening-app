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
    zip.file('script.js', this.generateScriptJS());
    
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

        .audio-player {
            text-align: center;
            margin: 30px 0;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .audio-controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin-bottom: 15px;
        }

        .play-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #3498db;
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .play-btn:hover {
            background: #2980b9;
            transform: scale(1.1);
        }

        .current-audio {
            font-weight: bold;
            color: #2c3e50;
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
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
        }

        .group-image {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            object-fit: cover;
            margin-right: 15px;
            border: 2px solid #e9ecef;
        }

        .group-title {
            font-size: 1.2rem;
            color: #2c3e50;
            font-weight: 500;
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
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #e9ecef;
            text-align: center;
            color: #6c757d;
            cursor: grab;
            transition: all 0.3s ease;
        }

        .audio-slot.filled {
            background: #d4edda;
            border-color: #c3e6cb;
            color: #155724;
        }

        .audio-slot.dragging {
            opacity: 0.5;
            cursor: grabbing;
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

        .score {
            text-align: center;
            margin-top: 20px;
            font-size: 1.2rem;
            font-weight: bold;
        }

        .correct {
            color: #27ae60;
        }

        .incorrect {
            color: #e74c3c;
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
                Écoutez l'audio et placez-le dans le bon groupe en cliquant sur une case vide.
            </p>
        </div>

        <div class="audio-player">
            <div class="audio-controls">
                <button class="play-btn" id="playBtn">▶</button>
                <div class="current-audio" id="currentAudio">Cliquez sur "Nouvel Audio" pour commencer</div>
            </div>
            <audio id="audioElement" preload="auto"></audio>
        </div>

        <div class="controls">
            <button class="btn btn-primary" id="newAudioBtn">Nouvel Audio</button>
            <button class="btn btn-success" id="checkBtn" style="display: none;">Vérifier</button>
            <button class="btn btn-primary" id="resetBtn">Recommencer</button>
        </div>

        <div class="groups-container" id="groupsContainer">
            <!-- Les groupes seront générés dynamiquement -->
        </div>

        <div class="score" id="scoreDisplay" style="display: none;">
            Score: <span id="score">0</span> / <span id="total">0</span>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>`;
  }

  private generateScriptJS(): string {
    return `class ListeningExercise {
    constructor() {
        this.importData = null;
        this.currentAudio = null;
        this.currentAudioId = null;
        this.userAnswers = {};
        this.score = 0;
        this.totalAnswers = 0;
        this.init();
    }

    async init() {
        await this.loadImportData();
        this.setupEventListeners();
        this.renderGroups();
    }

    async loadImportData() {
        try {
            const response = await fetch('import.json');
            this.importData = await response.json();
            console.log('Données chargées:', this.importData);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('playBtn').addEventListener('click', () => this.playCurrentAudio());
        document.getElementById('newAudioBtn').addEventListener('click', () => this.loadRandomAudio());
        document.getElementById('checkBtn').addEventListener('click', () => this.checkAnswer());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetExercise());
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

        const titleDiv = document.createElement('div');
        titleDiv.className = 'group-title';
        titleDiv.textContent = \`Groupe \${group.id}\`;
        headerDiv.appendChild(titleDiv);

        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.dataset.groupId = group.id;

        // Créer les emplacements pour les audios
        for (let i = 0; i < group.audioElements.length; i++) {
            const slot = document.createElement('div');
            slot.className = 'audio-slot';
            slot.dataset.slotIndex = i;
            slot.textContent = \`Emplacement \${i + 1}\`;
            slot.addEventListener('click', () => this.placeAudio(group.id, i));
            dropZone.appendChild(slot);
        }

        groupDiv.appendChild(headerDiv);
        groupDiv.appendChild(dropZone);

        return groupDiv;
    }

    getAllAudioElements() {
        const allAudios = [];
        this.importData.groups.forEach(group => {
            group.audioElements.forEach(audio => {
                allAudios.push({
                    ...audio,
                    correctGroupId: group.id
                });
            });
        });
        return allAudios;
    }

    loadRandomAudio() {
        const allAudios = this.getAllAudioElements();
        const availableAudios = allAudios.filter(audio => !this.userAnswers[audio.id]);

        if (availableAudios.length === 0) {
            alert('Tous les audios ont été placés !');
            return;
        }

        const randomAudio = availableAudios[Math.floor(Math.random() * availableAudios.length)];
        this.currentAudio = randomAudio;
        this.currentAudioId = randomAudio.id;

        const audioElement = document.getElementById('audioElement');
        audioElement.src = randomAudio.fileName;

        document.getElementById('currentAudio').textContent = randomAudio.originalName || \`Audio \${randomAudio.id}\`;
        document.getElementById('playBtn').textContent = '▶';
        document.getElementById('checkBtn').style.display = 'none';

        // Réinitialiser les états visuels
        this.clearHighlights();
    }

    playCurrentAudio() {
        if (!this.currentAudio) {
            alert('Veuillez d\\'abord charger un audio avec "Nouvel Audio"');
            return;
        }

        const audioElement = document.getElementById('audioElement');
        const playBtn = document.getElementById('playBtn');

        if (audioElement.paused) {
            audioElement.play().then(() => {
                playBtn.textContent = '⏸';
            }).catch(error => {
                console.error('Erreur lors de la lecture:', error);
                alert('Impossible de lire le fichier audio');
            });
        } else {
            audioElement.pause();
            playBtn.textContent = '▶';
        }

        audioElement.addEventListener('ended', () => {
            playBtn.textContent = '▶';
        });
    }

    placeAudio(groupId, slotIndex) {
        if (!this.currentAudio) {
            alert('Veuillez d\\'abord charger un audio avec "Nouvel Audio"');
            return;
        }

        // Marquer la réponse de l'utilisateur
        this.userAnswers[this.currentAudioId] = {
            selectedGroupId: groupId,
            slotIndex: slotIndex,
            correctGroupId: this.currentAudio.correctGroupId
        };

        // Mettre à jour l'interface
        const slot = document.querySelector(\`[data-group-id="\${groupId}"] .audio-slot[data-slot-index="\${slotIndex}"]\`);
        slot.textContent = this.currentAudio.originalName || \`Audio \${this.currentAudio.id}\`;
        slot.classList.add('filled');

        // Afficher le bouton de vérification
        document.getElementById('checkBtn').style.display = 'inline-block';
    }

    checkAnswer() {
        const answer = this.userAnswers[this.currentAudioId];
        const isCorrect = answer.selectedGroupId == answer.correctGroupId;

        // Mise à jour du score
        if (isCorrect) {
            this.score++;
        }
        this.totalAnswers++;

        // Affichage visuel
        const slot = document.querySelector(\`[data-group-id="\${answer.selectedGroupId}"] .audio-slot[data-slot-index="\${answer.slotIndex}"]\`);
        
        if (isCorrect) {
            slot.style.background = '#d4edda';
            slot.style.borderColor = '#c3e6cb';
            slot.style.color = '#155724';
        } else {
            slot.style.background = '#f8d7da';
            slot.style.borderColor = '#f5c6cb';
            slot.style.color = '#721c24';
            
            // Montrer la bonne réponse
            setTimeout(() => {
                this.highlightCorrectAnswer();
            }, 1000);
        }

        // Mettre à jour l'affichage du score
        this.updateScoreDisplay();

        // Préparer pour le prochain audio
        this.currentAudio = null;
        this.currentAudioId = null;
        document.getElementById('checkBtn').style.display = 'none';
        document.getElementById('currentAudio').textContent = 'Cliquez sur "Nouvel Audio" pour continuer';

        // Vérifier si l'exercice est terminé
        setTimeout(() => {
            const allAudios = this.getAllAudioElements();
            if (Object.keys(this.userAnswers).length === allAudios.length) {
                this.showFinalResults();
            }
        }, 2000);
    }

    highlightCorrectAnswer() {
        const answer = this.userAnswers[this.currentAudioId];
        const correctGroup = this.importData.groups.find(g => g.id == answer.correctGroupId);
        
        if (correctGroup) {
            const correctSlots = document.querySelectorAll(\`[data-group-id="\${answer.correctGroupId}"] .audio-slot\`);
            correctSlots.forEach(slot => {
                slot.style.border = '3px solid #28a745';
            });

            setTimeout(() => {
                correctSlots.forEach(slot => {
                    slot.style.border = '';
                });
            }, 3000);
        }
    }

    updateScoreDisplay() {
        document.getElementById('scoreDisplay').style.display = 'block';
        document.getElementById('score').textContent = this.score;
        document.getElementById('total').textContent = this.totalAnswers;
    }

    showFinalResults() {
        const percentage = Math.round((this.score / this.totalAnswers) * 100);
        alert(\`Exercice terminé !\\nScore: \${this.score}/\${this.totalAnswers} (\${percentage}%)\`);
        
        // Sauvegarder les résultats
        this.saveResults();
    }

    saveResults() {
        const results = {
            date: new Date().toISOString(),
            score: this.score,
            total: this.totalAnswers,
            percentage: Math.round((this.score / this.totalAnswers) * 100),
            answers: this.userAnswers
        };

        // Dans un environnement réel, vous pourriez sauvegarder dans localStorage
        // ou envoyer vers un serveur
        localStorage.setItem('lastExerciseResults', JSON.stringify(results));
        console.log('Résultats sauvegardés:', results);
    }

    clearHighlights() {
        document.querySelectorAll('.audio-slot').forEach(slot => {
            slot.style.border = '';
            slot.style.background = '';
            slot.style.borderColor = '';
            slot.style.color = '';
        });
    }

    resetExercise() {
        if (confirm('Êtes-vous sûr de vouloir recommencer l\\'exercice ?')) {
            this.userAnswers = {};
            this.score = 0;
            this.totalAnswers = 0;
            this.currentAudio = null;
            this.currentAudioId = null;

            document.getElementById('scoreDisplay').style.display = 'none';
            document.getElementById('checkBtn').style.display = 'none';
            document.getElementById('currentAudio').textContent = 'Cliquez sur "Nouvel Audio" pour commencer';

            // Réinitialiser tous les emplacements
            document.querySelectorAll('.audio-slot').forEach((slot, index) => {
                slot.textContent = \`Emplacement \${(index % 10) + 1}\`;
                slot.classList.remove('filled');
                slot.style.background = '';
                slot.style.borderColor = '';
                slot.style.color = '';
                slot.style.border = '';
            });

            this.clearHighlights();
        }
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
