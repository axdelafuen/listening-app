import { Component } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface DragItem {
  id: number;
  content: string;
  type: 'text' | 'audio' | 'image';
}

@Component({
  selector: 'app-drag-drop-exercise',
  templateUrl: './drag-drop-exercise.component.html',
  styleUrl: './drag-drop-exercise.component.css'
})
export class DragDropExerciseComponent {
  columns = [
    {
      id: 'source',
      title: 'Éléments disponibles',
      items: [
        { id: 1, content: 'Texte d\'exemple 1', type: 'text' as const },
        { id: 2, content: 'Audio d\'exemple 1', type: 'audio' as const },
        { id: 3, content: 'Image d\'exemple 1', type: 'image' as const },
        { id: 4, content: 'Texte d\'exemple 2', type: 'text' as const },
      ]
    },
    {
      id: 'target1',
      title: 'Zone de dépôt 1',
      items: []
    },
    {
      id: 'target2',
      title: 'Zone de dépôt 2',
      items: []
    }
  ];

  rows: Array<{id: string, title: string, items: DragItem[]}> = [
    {
      id: 'row1',
      title: 'Question 1',
      items: []
    },
    {
      id: 'row2', 
      title: 'Question 2',
      items: []
    },
    {
      id: 'row3',
      title: 'Question 3', 
      items: []
    }
  ];

  // Gestion du drop pour les colonnes
  dropColumn(event: CdkDragDrop<DragItem[]>, columnId: string) {
    if (event.previousContainer === event.container) {
      // Réorganiser dans la même colonne
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Déplacer entre colonnes
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  // Gestion du drop pour les lignes
  dropRow(event: CdkDragDrop<DragItem[]>, rowId: string) {
    if (event.previousContainer === event.container) {
      // Réorganiser dans la même ligne
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Déplacer entre lignes ou depuis les colonnes
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  // Ajouter un nouvel élément
  addNewItem(type: 'text' | 'audio' | 'image') {
    const newId = Math.max(...this.columns[0].items.map(item => item.id), 0) + 1;
    const newItem: DragItem = {
      id: newId,
      content: `Nouvel élément ${type} ${newId}`,
      type: type
    };
    this.columns[0].items.push(newItem);
  }

  // Supprimer un élément
  removeItem(item: DragItem, containerId: string) {
    // Trouver et supprimer l'élément de toutes les listes
    this.columns.forEach(column => {
      const index = column.items.findIndex(i => i.id === item.id);
      if (index > -1) {
        column.items.splice(index, 1);
      }
    });
    
    this.rows.forEach(row => {
      const index = row.items.findIndex(i => i.id === item.id);
      if (index > -1) {
        row.items.splice(index, 1);
      }
    });
  }

  // Réinitialiser l'exercice
  resetExercise() {
    // Remettre tous les éléments dans la colonne source
    const allItems: DragItem[] = [];
    
    this.columns.forEach(column => {
      allItems.push(...column.items);
      if (column.id !== 'source') {
        column.items = [];
      }
    });
    
    this.rows.forEach(row => {
      allItems.push(...row.items);
      row.items = [];
    });
    
    this.columns[0].items = allItems;
  }

  // Obtenir le nombre total d'éléments dans les lignes
  getTotalRowItems(): number {
    return this.rows.reduce((sum, row) => sum + row.items.length, 0);
  }
}
