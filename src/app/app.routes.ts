import { Routes } from '@angular/router';
import { AboutPageComponent } from './pages/about-page.component';
import { AdminPageComponent } from './pages/admin-page.component';
import { BlogDetailPageComponent } from './pages/blog-detail-page.component';
import { BlogListPageComponent } from './pages/blog-list-page.component';
import { CartPageComponent } from './pages/cart-page.component';
import { CataloguePageComponent } from './pages/catalogue-page.component';
import { CheckoutPageComponent } from './pages/checkout-page.component';
import { ContactPageComponent } from './pages/contact-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { FaqPageComponent } from './pages/faq-page.component';
import { HomePageComponent } from './pages/home-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { NotFoundPageComponent } from './pages/not-found-page.component';
import { PolicyPageComponent } from './pages/policy-page.component';
import { ProductDetailsPageComponent } from './pages/product-details-page.component';
import { RegisterPageComponent } from './pages/register-page.component';
import { WishlistPageComponent } from './pages/wishlist-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent, title: 'Clickkaar' },
  { path: 'catalogue', component: CataloguePageComponent, title: 'Catalogue | Clickkaar' },
  { path: 'products/:id', component: ProductDetailsPageComponent, title: 'Equipment Details | Clickkaar' },
  { path: 'cart', component: CartPageComponent, title: 'Booking Cart | Clickkaar' },
  { path: 'checkout', component: CheckoutPageComponent, title: 'Checkout | Clickkaar' },
  { path: 'login', component: LoginPageComponent, title: 'Login | Clickkaar' },
  { path: 'register', component: RegisterPageComponent, title: 'Register | Clickkaar' },
  { path: 'dashboard', component: DashboardPageComponent, title: 'Dashboard | Clickkaar' },
  { path: 'admin', component: AdminPageComponent, title: 'Admin | Clickkaar' },
  { path: 'wishlist', component: WishlistPageComponent, title: 'Wishlist | Clickkaar' },
  { path: 'blog', component: BlogListPageComponent, title: 'Blog | Clickkaar' },
  { path: 'blog/:slug', component: BlogDetailPageComponent, title: 'Blog Detail | Clickkaar' },
  { path: 'about', component: AboutPageComponent, title: 'About | Clickkaar' },
  { path: 'contact', component: ContactPageComponent, title: 'Contact | Clickkaar' },
  { path: 'faq', component: FaqPageComponent, title: 'FAQ | Clickkaar' },
  { path: 'terms', component: PolicyPageComponent, data: { page: 'terms' }, title: 'Terms | Clickkaar' },
  { path: 'privacy', component: PolicyPageComponent, data: { page: 'privacy' }, title: 'Privacy | Clickkaar' },
  { path: '**', component: NotFoundPageComponent, title: '404 | Clickkaar' }
];
