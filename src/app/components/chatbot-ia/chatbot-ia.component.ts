import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IAService, ChatResponse } from '../../services/ia.service';

interface Mensaje {
  tipo: 'usuario' | 'bot';
  contenido: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot-ia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot-ia.component.html',
  styleUrls: ['./chatbot-ia.component.css']
})
export class ChatbotIAComponent {
  mensajes: Mensaje[] = [];
  mensajeInput: string = '';
  cargando: boolean = false;
  sugerencias: string[] = [];
  chatAbierto: boolean = false;

  constructor(
    private iaService: IAService,
    private cdr: ChangeDetectorRef
  ) {
    // Agregar mensaje inicial sin detectChanges
    this.mensajes.push({
      tipo: 'bot',
      contenido: '¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    });
  }

  toggleChat() {
    this.chatAbierto = !this.chatAbierto;
    if (this.chatAbierto && this.mensajes.length === 1) {
      // Primera vez que se abre
      this.sugerencias = [
        '¿Cuál es el horario de atención?',
        '¿Qué métodos de pago aceptan?',
        '¿Tienen mouse gamer disponible?'
      ];
    }
  }

  enviarMensaje() {
    if (!this.mensajeInput.trim() || this.cargando) return;
    
    const mensaje = this.mensajeInput.trim();
    this.agregarMensaje('usuario', mensaje);
    this.mensajeInput = '';
    this.cargando = true;
    this.sugerencias = [];
    this.cdr.detectChanges(); // Forzar actualización

    this.iaService.enviarMensajeChatbot(mensaje)
      .subscribe({
        next: (data: ChatResponse) => {
          this.agregarMensaje('bot', data.respuesta);
          this.sugerencias = data.sugerencias || [];
          this.cargando = false;
          this.cdr.detectChanges(); // Forzar actualización después de recibir respuesta
          
          if (data.requiere_humano) {
            setTimeout(() => {
              this.agregarMensaje('bot', 
                '📧 Para asistencia personalizada, contáctanos en ventas@tienda.cl o llama al +56 9 1234 5678'
              );
              this.cdr.detectChanges(); // Forzar actualización del mensaje adicional
            }, 1000);
          }
        },
        error: (err) => {
          console.error('Error en chatbot:', err);
          this.agregarMensaje('bot', 
            'Disculpa, estoy teniendo problemas técnicos. Por favor intenta de nuevo en unos momentos.'
          );
          this.cargando = false;
          this.cdr.detectChanges(); // Forzar actualización en caso de error
        }
      });
  }

  usarSugerencia(sugerencia: string) {
    this.mensajeInput = sugerencia;
    this.enviarMensaje();
  }

  private agregarMensaje(tipo: 'usuario' | 'bot', contenido: string) {
    this.mensajes = [...this.mensajes, {
      tipo,
      contenido,
      timestamp: new Date()
    }];
    
    // Forzar actualización cuando se agrega un mensaje
    setTimeout(() => {
      this.cdr.detectChanges();
      this.scrollToBottom();
    }, 0);
  }

  private scrollToBottom() {
    const container = document.querySelector('.chat-mensajes');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }
}
