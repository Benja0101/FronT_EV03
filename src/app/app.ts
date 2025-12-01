import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ChatbotIAComponent } from './components/chatbot-ia/chatbot-ia.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ChatbotIAComponent],
  templateUrl: './app.html', //
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('cliente_web');
}
