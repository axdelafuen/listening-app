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
        this.updateTitle();
        this.renderGroups();
        this.prepareAudioElements();
        this.showNextAudio();
    }

    updateTitle() {
        const titleElement = document.getElementById('exerciseTitle');
        if (titleElement && this.importData.title) {
            titleElement.textContent = this.importData.title;
        }
    }

    setupEventListeners() {
        document.getElementById('validateBtn').addEventListener('click', () => this.validateAllAnswers());
        
        // Attendre que les éléments soient disponibles pour la gestion du volume
        setTimeout(() => {
            const volumeSlider = document.getElementById('volumeSlider');
            const volumeValue = document.getElementById('volumeValue');
            const audioElement = document.getElementById('audioElement');
            
            if (volumeSlider && volumeValue && audioElement) {
                volumeSlider.addEventListener('input', (e) => {
                    const volume = e.target.value / 100;
                    audioElement.volume = volume;
                    volumeValue.textContent = e.target.value + '%';
                });
                
                // Initialiser le volume
                audioElement.volume = 0.7;
            }
        }, 100);
        
        // Gestion du drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        // Événements pour les zones de dépôt (emplacements)
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const dropZone = e.target.closest('.audio-slot');
            if (dropZone) {
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
            if (dropZone) {
                dropZone.classList.remove('drag-over');
                try {
                    const draggedData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    this.handleDrop(draggedData, dropZone);
                } catch (error) {
                    // Fallback pour l'ancien système
                    const audioId = e.dataTransfer.getData('text/plain');
                    if (audioId && !isNaN(parseInt(audioId))) {
                        this.placeAudio(audioId, dropZone);
                    }
                }
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
            img.alt = `Groupe ${group.id}`;
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
            slot.textContent = `Emplacement ${i + 1}`;
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
        // Ne pas jouer automatiquement l'audio
    }

    createAudioElement(audioData) {
        const container = document.getElementById('audioElementsContainer');
        
        const audioElement = document.createElement('div');
        audioElement.className = 'audio-element';
        audioElement.draggable = true;
        audioElement.dataset.audioId = audioData.id;
        
        const playIcon = document.createElement('span');
        playIcon.className = 'play-icon';
        playIcon.textContent = '▶';
        playIcon.title = 'Jouer/Pause';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = audioData.originalName || `Audio ${audioData.id}`;
        
        audioElement.appendChild(playIcon);
        audioElement.appendChild(nameSpan);

        // Événements de drag
        audioElement.addEventListener('dragstart', (e) => {
            const dragData = {
                type: 'pending',
                audioId: audioData.id,
                audioData: audioData
            };
            e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            e.dataTransfer.effectAllowed = 'move';
            audioElement.classList.add('dragging');
        });

        audioElement.addEventListener('dragend', () => {
            audioElement.classList.remove('dragging');
        });

        // Clic sur l'icône play pour jouer/pause l'audio
        playIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleAudio(audioData, playIcon);
        });

        container.appendChild(audioElement);
    }

    handleDrop(draggedData, dropZone) {
        try {
            if (draggedData && draggedData.type === 'pending') {
                this.placeAudioFromPending(draggedData, dropZone);
            } else if (draggedData && draggedData.type === 'placed') {
                this.moveOrSwapPlacedAudio(draggedData, dropZone);
            } else {
                console.warn('Type de drag non reconnu:', draggedData);
            }
        } catch (error) {
            console.error('Erreur dans handleDrop:', error);
        }
    }

    placeAudioFromPending(draggedData, slotElement) {
        if (slotElement.classList.contains('filled')) {
            const existingPlacement = this.findPlacementBySlot(slotElement);
            if (existingPlacement) {
                this.returnToContainer(existingPlacement.audioData);
                this.removePlacement(existingPlacement.audioId);
            }
        }

        const audioData = draggedData.audioData;
        const groupId = slotElement.dataset.groupId;
        const slotIndex = slotElement.dataset.slotIndex;

        this.userPlacements[audioData.id] = {
            groupId: groupId,
            slotIndex: slotIndex,
            correctGroupId: audioData.correctGroupId,
            audioData: audioData
        };

        this.updateSlotDisplay(slotElement, audioData);
        this.removeFromContainer(audioData.id);
        
        this.currentAudioIndex++;
        setTimeout(() => {
            this.showNextAudio();
        }, 1000);
    }

    moveOrSwapPlacedAudio(draggedData, targetSlot) {
        const sourceSlot = document.querySelector(`[data-group-id="${draggedData.groupId}"][data-slot-index="${draggedData.slotIndex}"]`);
        
        if (targetSlot.classList.contains('filled')) {
            // Échange entre deux emplacements
            const targetPlacement = this.findPlacementBySlot(targetSlot);
            if (targetPlacement) {
                // Mettre à jour les placements
                this.userPlacements[draggedData.audioId].groupId = targetSlot.dataset.groupId;
                this.userPlacements[draggedData.audioId].slotIndex = targetSlot.dataset.slotIndex;
                
                this.userPlacements[targetPlacement.audioId].groupId = sourceSlot.dataset.groupId;
                this.userPlacements[targetPlacement.audioId].slotIndex = sourceSlot.dataset.slotIndex;
                
                // Mettre à jour l'affichage
                this.updateSlotDisplay(targetSlot, draggedData.audioData);
                this.updateSlotDisplay(sourceSlot, targetPlacement.audioData);
            }
        } else {
            // Déplacement simple vers un emplacement vide
            this.userPlacements[draggedData.audioId].groupId = targetSlot.dataset.groupId;
            this.userPlacements[draggedData.audioId].slotIndex = targetSlot.dataset.slotIndex;
            
            this.updateSlotDisplay(targetSlot, draggedData.audioData);
            this.clearSlot(sourceSlot);
        }
    }

    clearSlot(slot) {
        const slotIndex = parseInt(slot.dataset.slotIndex) + 1;
        slot.textContent = `Emplacement ${slotIndex}`;
        slot.classList.remove('filled');
        slot.draggable = false;
    }

    updateSlotDisplay(slot, audioData) {
        slot.textContent = audioData.originalName || `Audio ${audioData.id}`;
        slot.classList.add('filled');
        slot.draggable = true;
        
        // Ajouter un bouton play simple
        const playBtn = document.createElement('button');
        playBtn.className = 'play-button';
        playBtn.textContent = '▶';
        playBtn.style.cssText = 'position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; color: white; cursor: pointer; font-size: 10px;';
        
        playBtn.onclick = (e) => {
            e.stopPropagation();
            this.playPlacedAudio(audioData.id);
        };
        
        slot.style.position = 'relative';
        slot.appendChild(playBtn);
        
        // Événements de drag pour les éléments placés
        slot.addEventListener('dragstart', (e) => {
            try {
                const placement = this.userPlacements[audioData.id];
                const dragData = {
                    type: 'placed',
                    audioId: audioData.id,
                    audioData: audioData,
                    groupId: placement.groupId,
                    slotIndex: placement.slotIndex
                };
                e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                e.dataTransfer.effectAllowed = 'move';
                slot.classList.add('dragging');
            } catch (error) {
                console.error('Erreur dans dragstart:', error);
            }
        });
        
        slot.addEventListener('dragend', () => {
            slot.classList.remove('dragging');
        });
    }

    findPlacementBySlot(slot) {
        const groupId = slot.dataset.groupId;
        const slotIndex = slot.dataset.slotIndex;
        
        for (const [audioId, placement] of Object.entries(this.userPlacements)) {
            if (placement.groupId === groupId && placement.slotIndex === slotIndex) {
                return { audioId: parseInt(audioId), ...placement };
            }
        }
        return null;
    }

    returnToContainer(audioData) {
        this.createAudioElement(audioData);
    }

    removeFromContainer(audioId) {
        const element = document.querySelector(`[data-audio-id="${audioId}"]`);
        if (element) {
            element.remove();
        }
    }

    removePlacement(audioId) {
        delete this.userPlacements[audioId];
    }

    playPlacedAudio(audioId) {
        const placement = this.userPlacements[audioId];
        if (placement) {
            this.stopAllAudio();
            this.playAudio(placement.audioData);
            
            const slot = document.querySelector(`[data-group-id="${placement.groupId}"][data-slot-index="${placement.slotIndex}"] .play-button`);
            if (slot) {
                slot.textContent = '⏸';
            }
        }
    }

    stopAllAudio() {
        const audioElement = document.getElementById('audioElement');
        audioElement.pause();
        
        document.querySelectorAll('.play-icon').forEach(icon => {
            icon.textContent = '▶';
        });
        document.querySelectorAll('.play-button').forEach(button => {
            button.textContent = '▶';
        });
        
        if (this.currentlyPlaying) {
            this.currentlyPlaying.classList.remove('playing');
            this.currentlyPlaying = null;
        }
    }

    toggleAudio(audioData, playIcon) {
        const audioElement = document.getElementById('audioElement');
        
        // Si c'est le même audio qui joue actuellement
        if (audioElement.src && audioElement.src.includes(audioData.fileName)) {
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
        
        // Arrêter tous les autres audios
        this.stopAllAudio();
        
        audioElement.src = audioData.fileName;

        const audioElementDiv = document.querySelector(`[data-audio-id="${audioData.id}"]`);
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
            // Réinitialiser tous les boutons
            document.querySelectorAll('.play-button').forEach(button => {
                button.textContent = '▶';
            });
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

    placeAudio(audioId, slotElement) {
        // Cette méthode est conservée pour la compatibilité, elle redirige vers le nouveau système
        const numericAudioId = parseInt(audioId);
        const audioData = this.allAudioElements.find(a => a.id === numericAudioId);
        if (!audioData) {
            console.error('Audio non trouvé:', audioId, 'dans', this.allAudioElements);
            return;
        }

        const dragData = {
            type: 'pending',
            audioId: numericAudioId,
            audioData: audioData
        };

        this.handleDrop(dragData, slotElement);
    }

    checkIfCompleted() {
        const totalAudios = this.allAudioElements.length;
        const placedAudios = Object.keys(this.userPlacements).length;

        if (placedAudios === totalAudios) {
            // Tous les audios sont placés, afficher le bouton de validation
            document.getElementById('validateBtn').style.display = 'inline-block';
            
            // Cacher la zone des éléments audio car elle est maintenant vide
            document.querySelector('.audio-elements-zone').style.display = 'none';
            
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
            const slot = document.querySelector(`[data-group-id="${placement.groupId}"][data-slot-index="${placement.slotIndex}"]`);

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

        const percentage = Math.round((correctAnswers / totalAnswers) * 100);
        this.displayScore(correctAnswers, totalAnswers, percentage);

        document.getElementById('validateBtn').style.display = 'none';
        
        this.gameCompleted = true;
    }

    displayScore(correctAnswers, totalAnswers, percentage) {
        const scoreDisplay = document.getElementById('scoreDisplay');
        const scoreText = document.getElementById('scoreText');

        scoreDisplay.style.display = 'block';
        
        scoreText.textContent = `Score: ${correctAnswers}/${totalAnswers} (${percentage}%)`;

        if (percentage >= 80) {
            scoreText.style.color = '#27ae60';
        } else if (percentage >= 60) {
            scoreText.style.color = '#f39c12';
        } else {
            scoreText.style.color = '#e74c3c';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.exercise = new ListeningExercise();
});