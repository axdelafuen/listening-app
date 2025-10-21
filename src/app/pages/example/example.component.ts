import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { ExampleMockService } from '../../services/example-mock/example-mock.service';
import { ExerciseData } from '../../models/exercise.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class ExampleComponent implements AfterViewInit, OnDestroy {
  @ViewChild('exampleHost', { static: true }) host!: ElementRef<HTMLDivElement>;

  constructor(private mockService: ExampleMockService, private zone: NgZone, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  private mockData!: ExerciseData;

  ngAfterViewInit(): void {
    if (!this.isBrowser()) return;
    this.mockData = this.mockService.generateMock();
    this.loadAndRenderTemplate();
  }

  private async loadAndRenderTemplate(): Promise<void> {
    if (!this.isBrowser()) return;
    const linkId = 'example-template-styles';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = '/assets/templates/styles.css';
      document.head.appendChild(link);
    }

    try {
      const response = await fetch('/assets/templates/index.html');
      const htmlText = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const containerFromTemplate = doc.querySelector('.container');
      const hostEl = this.host.nativeElement;
      if (containerFromTemplate) {
        const clone = containerFromTemplate.cloneNode(true) as HTMLElement;

        const backWrapper = document.createElement('div');
        backWrapper.style.textAlign = 'center';
        backWrapper.style.margin = '2rem 0';
        const backBtn = document.createElement('button');
        backBtn.className = 'btn btn-secondary';
        backBtn.textContent = '← Retour';
        backBtn.addEventListener('click', () => this.goBack());
        backWrapper.appendChild(backBtn);
        clone.appendChild(backWrapper);

        hostEl.innerHTML = '';
        hostEl.appendChild(clone);
      } else {
        console.error('Conteneur .container introuvable dans le template index.html');
      }
    } catch (e) {
      console.error('Erreur chargement template HTML', e);
    }

    (window as any).EXERCISE_DATA = this.mockData;

    const ensureEngine = (): Promise<void> => new Promise((resolve, reject) => {
      if (!this.isBrowser()) { resolve(); return; }
      if ((window as any).ListeningExercise) { resolve(); return; }
      const existing = document.getElementById('listening-engine-script');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Echec script existant')));
        return;
      }
      const script = document.createElement('script');
      script.id = 'listening-engine-script';
      script.src = '/assets/templates/exercise-engine.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Echec chargement exercise-engine.js'));
      document.body.appendChild(script);
    });

    try {
      await ensureEngine();
      if ((window as any).initListeningExercise) {
        (window as any).initListeningExercise(this.mockData);
      } else if ((window as any).ListeningExercise) {
        (window as any).exercise = new (window as any).ListeningExercise(this.mockData);
      }
    } catch (e) {
      console.error('Impossible d\'initialiser le moteur', e);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (!this.isBrowser()) return;
    try {
      if ((window as any).exercise && typeof (window as any).exercise.cleanup === 'function') {
        (window as any).exercise.cleanup();
      }
    } catch {}
    const link = document.getElementById('example-template-styles');
    if (link?.parentElement) link.parentElement.removeChild(link);
    if (this.host?.nativeElement) this.host.nativeElement.innerHTML = '';
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
}
