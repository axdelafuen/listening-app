import { Component, ViewChild, ElementRef } from '@angular/core';
import { ImportService } from '../../services/import/import.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  @ViewChild('importInput') importInput!: ElementRef<HTMLInputElement>;

  isImporting = false;
  importError: string | null = null;

  constructor(private importService: ImportService, private router: Router) {}

  triggerImport() {
    if (this.isImporting) return;
    this.importError = null;
    this.importInput.nativeElement.value = '';
    this.importInput.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.isImporting = true;
    this.importError = null;
    try {
      await this.importService.importFromZip(file);
      this.router.navigate(['/create-exercise'], { queryParams: { imported: '1' } });
    } catch (e: any) {
      console.error(e);
      this.importError = e.message || 'Erreur lors de l\'import';
    } finally {
      this.isImporting = false;
    }
  }

}
