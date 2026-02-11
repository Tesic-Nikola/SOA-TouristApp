import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { authInterceptor } from './interceptors/auth.interceptor';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { BlogsComponent } from './components/blogs/blogs.component';
import { BlogDetailComponent } from './components/blog-detail/blog-detail.component';
import { BlogCreateComponent } from './components/blog-create/blog-create.component';
import { RecommendationsComponent } from './components/recommendations/recommendations.component';
import { PositionSimulatorComponent } from './components/position-simulator/position-simulator.component';
import { ToursComponent } from './components/tours/tours.component';
import { TourDetailComponent } from './components/tour-detail/tour-detail.component';
import { MyToursComponent } from './components/my-tours/my-tours.component';
import { TourEditComponent } from './components/tour-edit/tour-edit.component';
import { CartComponent } from './components/cart/cart.component';
import { MyPurchasesComponent } from './components/my-purchases/my-purchases.component';
import { TourExecutionComponent } from './components/tour-execution/tour-execution.component';

@NgModule({
  declarations: [
    App,
    LoginComponent,
    RegisterComponent,
    NavbarComponent,
    HomeComponent,
    ProfileComponent,
    ProfileEditComponent,
    BlogsComponent,
    BlogDetailComponent,
    BlogCreateComponent,
    RecommendationsComponent,
    PositionSimulatorComponent,
    ToursComponent,
    TourDetailComponent,
    MyToursComponent,
    TourEditComponent,
    CartComponent,
    MyPurchasesComponent,
    TourExecutionComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor]))
  ],
  bootstrap: [App]
})
export class AppModule { }