import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  isAuthenticated$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    public router: Router
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  navigateTo(path: string): void {
    // Si ya estamos en la misma ruta, forzar recarga navegando a una ruta temporal
    if (this.router.url === path) {
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([path]);
      });
    } else {
      this.router.navigate([path]);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
