import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AboutPageComponent } from './pages/about-page.component';
import { AdminProductCreatePageComponent } from './pages/admin-product-create-page.component';
import { AdminPageComponent } from './pages/admin-page.component';
import { BlogDetailPageComponent } from './pages/blog-detail-page.component';
import { BlogListPageComponent } from './pages/blog-list-page.component';
import { CartPageComponent } from './pages/cart-page.component';
import { CataloguePageComponent } from './pages/catalogue-page.component';
import { CheckoutPageComponent } from './pages/checkout-page.component';
import { ContactPageComponent } from './pages/contact-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { FaqPageComponent } from './pages/faq-page.component';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page.component';
import { HomePageComponent } from './pages/home-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { NotFoundPageComponent } from './pages/not-found-page.component';
import { PolicyPageComponent } from './pages/policy-page.component';
import { ProductDetailsPageComponent } from './pages/product-details-page.component';
import { RegisterPageComponent } from './pages/register-page.component';
import { StaffDashboardPageComponent } from './pages/staff-dashboard-page.component';
import { WishlistPageComponent } from './pages/wishlist-page.component';
import { AuthService } from './services/auth.service';

const requireCustomer = (returnUrl: string) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();
  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  }
  return authService.isCustomer() ? true : router.createUrlTree([authService.defaultDashboardUrl()]);
};

const requireAdmin = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();
  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: '/admin' } });
  }
  return authService.isAdmin() ? true : router.createUrlTree(['/dashboard']);
};

const requireAnyRole = (roles: string[], returnUrl: string) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();
  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  }
  return roles.some((role) => authService.hasRole(role)) ? true : router.createUrlTree([authService.defaultDashboardUrl()]);
};

export const routes: Routes = [
  { path: '', component: HomePageComponent, title: 'Clickkaar' },
  { path: 'catalogue', component: CataloguePageComponent, title: 'Catalogue | Clickkaar' },
  { path: 'products/:id', component: ProductDetailsPageComponent, title: 'Equipment Details | Clickkaar' },
  { path: 'cart', component: CartPageComponent, canActivate: [() => requireCustomer('/cart')], title: 'Booking Cart | Clickkaar' },
  { path: 'checkout', component: CheckoutPageComponent, canActivate: [() => requireCustomer('/checkout')], title: 'Checkout | Clickkaar' },
  { path: 'login', component: LoginPageComponent, title: 'Login | Clickkaar' },
  { path: 'forgot-password', component: ForgotPasswordPageComponent, title: 'Forgot Password | Clickkaar' },
  { path: 'register', component: RegisterPageComponent, title: 'Register | Clickkaar' },
  { path: 'dashboard', component: DashboardPageComponent, title: 'Dashboard | Clickkaar' },
  { path: 'admin/inventory/new', component: AdminProductCreatePageComponent, canActivate: [() => requireAnyRole(['ADMIN', 'MANAGER', 'INVENTORY_STAFF'], '/admin/inventory/new')], title: 'Add Product | Clickkaar' },
  { path: 'admin', component: AdminPageComponent, canActivate: [requireAdmin], title: 'Admin | Clickkaar' },
  { path: 'manager-dashboard', component: StaffDashboardPageComponent, canActivate: [() => requireAnyRole(['MANAGER'], '/manager-dashboard')], title: 'Manager Dashboard | Clickkaar' },
  { path: 'inventory-dashboard', component: StaffDashboardPageComponent, canActivate: [() => requireAnyRole(['INVENTORY_STAFF'], '/inventory-dashboard')], title: 'Inventory Dashboard | Clickkaar' },
  { path: 'content-dashboard', component: StaffDashboardPageComponent, canActivate: [() => requireAnyRole(['CONTENT_EDITOR'], '/content-dashboard')], title: 'Content Dashboard | Clickkaar' },
  { path: 'wishlist', component: WishlistPageComponent, canActivate: [() => requireCustomer('/wishlist')], title: 'Wishlist | Clickkaar' },
  { path: 'blog', component: BlogListPageComponent, title: 'Blog | Clickkaar' },
  { path: 'blog/:slug', component: BlogDetailPageComponent, title: 'Blog Detail | Clickkaar' },
  { path: 'about', component: AboutPageComponent, title: 'About | Clickkaar' },
  { path: 'contact', component: ContactPageComponent, title: 'Contact | Clickkaar' },
  { path: 'faq', component: FaqPageComponent, title: 'FAQ | Clickkaar' },
  { path: 'terms', component: PolicyPageComponent, data: { page: 'terms' }, title: 'Terms | Clickkaar' },
  { path: 'privacy', component: PolicyPageComponent, data: { page: 'privacy' }, title: 'Privacy | Clickkaar' },
  { path: '**', component: NotFoundPageComponent, title: '404 | Clickkaar' }
];
