import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { ReporteComponent } from './components/reporte/reporte.component';
import { AnalisisDetalleComponent } from './components/analisis-detalle/analisis-detalle.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {path:'',redirectTo:'/login',pathMatch:'full'},
    {path:'login',component:LoginComponent},
    {path:'register',component:RegisterComponent},
    {path:'home',component:HomeComponent} ,
    { path: 'reportes', component: ReporteComponent, canActivate: [authGuard] },
    { path: 'analisis/:id', component: AnalisisDetalleComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/home' }
];
