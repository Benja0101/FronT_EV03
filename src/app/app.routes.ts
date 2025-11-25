import { Routes } from '@angular/router';
import { Login } from './pages/login/login.component';
import { ClientesListaComponent } from './pages/clientes-lista/clientes-lista.component';
import { ClienteCrearComponent } from './pages/cliente-crear/cliente-crear.component';
import { ProductosListaComponent } from './pages/productos-lista/productos-lista.component';
import { ProductoCrearComponent } from './pages/producto-crear/producto-crear.component';
import { VentasComponent } from './pages/ventas/ventas.component';
import { HomeClienteComponent } from './pages/home-cliente/home-cliente.component';
import { CarritoComponent } from './pages/carrito/carrito.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { Pago } from './pages/pago/pago';
import { ConfirmacionCompra } from './pages/confirmacion-compra/confirmacion-compra';
import { Dashboard } from './pages/dashboard/dashboard';
import { PerfilCliente } from './pages/perfil-cliente/perfil-cliente';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/cliente/home', pathMatch: 'full' },
  { path: 'login', component: Login },
  
  // Rutas de administrador
  { path: 'admin/dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'admin/clientes', component: ClientesListaComponent, canActivate: [authGuard] },
  { path: 'admin/clientes/crear', component: ClienteCrearComponent, canActivate: [authGuard] },
  { path: 'admin/productos', component: ProductosListaComponent, canActivate: [authGuard] },
  { path: 'admin/productos/crear', component: ProductoCrearComponent, canActivate: [authGuard] },
  { path: 'admin/ventas', component: VentasComponent, canActivate: [authGuard] },
  
  // Rutas de cliente (sin autenticación)
  { path: 'cliente/home', component: HomeClienteComponent },
  { path: 'cliente/carrito', component: CarritoComponent },
  { path: 'cliente/checkout', component: CheckoutComponent },
  { path: 'cliente/pago', component: Pago },
  { path: 'cliente/confirmacion', component: ConfirmacionCompra },
  { path: 'cliente/perfil', component: PerfilCliente },
  
  // Mantener rutas antiguas para compatibilidad
  { path: 'clientes', redirectTo: '/admin/clientes' },
  { path: 'productos', redirectTo: '/admin/productos' },
  { path: 'ventas', redirectTo: '/admin/ventas' },
  
  { path: '**', redirectTo: '/cliente/home' }
];

