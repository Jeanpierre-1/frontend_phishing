import { Component,OnInit } from '@angular/core';
import { Router,NavigationEnd} from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  isAuthenticated: boolean = false;
   showLogoutButton: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ){}

  ngOnInit(): void {
    this.checkAuthentication();

     // Escuchar cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkAuthentication();
      this.updateLogoutButtonVisibility();
    });

    this.updateLogoutButtonVisibility();
  }
 checkAuthentication(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
  }

    updateLogoutButtonVisibility(): void {
    // Mostrar botón de cerrar sesión solo en /home
    this.showLogoutButton = this.router.url === '/home' && this.isAuthenticated;
  }

  logout(): void {
   this.authService.logout();
    this.isAuthenticated = false;
    this.showLogoutButton = false;
    this.router.navigate(['/login']);
  }

}
