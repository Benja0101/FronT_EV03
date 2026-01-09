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
import { LoginClienteComponent } from './pages/login-cliente/login-cliente.component';
import { RegistroClienteComponent } from './pages/registro-cliente/registro-cliente.component';
import { adminGuard, clienteGuard, guestGuard } from './guards/guards';

export const routes: Routes = [
  { path: '', redirectTo: '/cliente/home', pathMatch: 'full' },
  
  // Rutas de autenticación
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'login-cliente', component: LoginClienteComponent, canActivate: [guestGuard] },
  { path: 'registro-cliente', component: RegistroClienteComponent, canActivate: [guestGuard] },
  
  // Rutas de administrador (requieren autenticación de admin)
  { path: 'admin/dashboard', component: Dashboard, canActivate: [adminGuard] },
  { path: 'admin/clientes', component: ClientesListaComponent, canActivate: [adminGuard] },
  { path: 'admin/clientes/crear', component: ClienteCrearComponent, canActivate: [adminGuard] },
  { path: 'admin/productos', component: ProductosListaComponent, canActivate: [adminGuard] },
  { path: 'admin/productos/crear', component: ProductoCrearComponent, canActivate: [adminGuard] },
  { path: 'admin/ventas', component: VentasComponent, canActivate: [adminGuard] },
  
  // Rutas de cliente públicas (sin autenticación requerida)
  { path: 'cliente/home', component: HomeClienteComponent },
  { path: 'cliente/carrito', component: CarritoComponent },
  { path: 'cliente/checkout', component: CheckoutComponent },
  { path: 'cliente/pago', component: Pago },
  { path: 'cliente/confirmacion', component: ConfirmacionCompra },
  
  // Rutas de cliente protegidas (requieren autenticación de cliente)
  { path: 'cliente/perfil', component: PerfilCliente, canActivate: [clienteGuard] },
  
  // Mantener rutas antiguas para compatibilidad
  { path: 'clientes', redirectTo: '/admin/clientes' },
  { path: 'productos', redirectTo: '/admin/productos' },
  { path: 'ventas', redirectTo: '/admin/ventas' },
  
  { path: '**', redirectTo: '/cliente/home' }
];


