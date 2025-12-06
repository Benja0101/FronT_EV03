import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ChatbotIAComponent } from './components/chatbot-ia/chatbot-ia.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ChatbotIAComponent],
  templateUrl: './app.html', //
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('cliente_web');

  constructor(private router: Router) {
    // Forzar scroll al inicio en CADA cambio de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Intentar todos los métodos posibles
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    });
  }
}
