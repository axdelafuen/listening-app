import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateExerciseComponent } from './pages/create-exercise/create-exercise.component';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { ExampleComponent } from './pages/example/example.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'create-exercise', component: CreateExerciseComponent },
  { path: 'about', component: AboutComponent },
  { path: 'example', component: ExampleComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
