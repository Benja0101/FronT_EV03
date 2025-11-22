import { Routes } from '@angular/router';
import { Login } from './login/login.component';
import { ClientesListaComponent } from './clientes-lista/clientes-lista.component';
import { ClienteCrearComponent } from './cliente-crear/cliente-crear.component';
import { ClienteEditarComponent } from './cliente-editar/cliente-editar.component';
import { ProductosListaComponent } from './productos-lista/productos-lista.component';
import { ProductoCrearComponent } from './producto-crear/producto-crear.component';
import { VentasComponent } from './ventas/ventas.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'clientes', component: ClientesListaComponent },
  { path: 'clientes/crear', component: ClienteCrearComponent },
  { path: 'clientes/editar/:rut', component: ClienteEditarComponent },
  { path: 'productos', component: ProductosListaComponent },
  { path: 'productos/crear', component: ProductoCrearComponent },
  { path: 'ventas', component: VentasComponent },
  { path: '**', redirectTo: '/login' }
];
