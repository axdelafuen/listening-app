export interface AudioElement {
  id: number;
  fileName: string;
  originalName: string;
}

export interface ExerciseGroup {
  id: number;
  backgroundImage: string | null;
  audioElements: AudioElement[];
}

export interface ExerciseData {
  title: string;
  groups: ExerciseGroup[];
}
