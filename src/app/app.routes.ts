import { Routes } from '@angular/router';
import { Login } from './pages/login/login.component';
import { ClientesListaComponent } from './pages/clientes-lista/clientes-lista.component';
import { ClienteCrearComponent } from './pages/cliente-crear/cliente-crear.component';
import { ClienteEditarComponent } from './pages/cliente-editar/cliente-editar.component';
import { ProductosListaComponent } from './pages/productos-lista/productos-lista.component';
import { ProductoCrearComponent } from './pages/producto-crear/producto-crear.component';
import { VentasComponent } from './pages/ventas/ventas.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/productos', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'clientes', component: ClientesListaComponent, canActivate: [authGuard] },
  { path: 'clientes/crear', component: ClienteCrearComponent, canActivate: [authGuard] },
  { path: 'clientes/editar/:rut', component: ClienteEditarComponent, canActivate: [authGuard] },
  { path: 'productos', component: ProductosListaComponent, canActivate: [authGuard] },
  { path: 'productos/crear', component: ProductoCrearComponent, canActivate: [authGuard] },
  { path: 'ventas', component: VentasComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];
