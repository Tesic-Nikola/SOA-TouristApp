import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { authGuard, roleGuard } from './guards/auth.guard';
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

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile/:id', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'profile/:id/edit', component: ProfileEditComponent, canActivate: [authGuard] },
  { path: 'blogs', component: BlogsComponent },
  { path: 'blogs/create', component: BlogCreateComponent, canActivate: [authGuard] },
  { path: 'blogs/:id', component: BlogDetailComponent },
  { path: 'recommendations', component: RecommendationsComponent, canActivate: [authGuard] },
  { path: 'position', component: PositionSimulatorComponent, canActivate: [roleGuard([0])] }, // Tourist only
  { path: 'tours', component: ToursComponent },
  { path: 'tours/create', component: TourEditComponent, canActivate: [roleGuard([1])] }, // Guide only
  { path: 'tours/:id', component: TourDetailComponent },
  { path: 'tours/:id/edit', component: TourEditComponent, canActivate: [roleGuard([1])] }, // Guide only
  { path: 'my-tours', component: MyToursComponent, canActivate: [roleGuard([1])] }, // Guide only
  { path: 'cart', component: CartComponent, canActivate: [roleGuard([0])] }, // Tourist only
  { path: 'purchases', component: MyPurchasesComponent, canActivate: [roleGuard([0])] }, // Tourist only
  { path: 'tour-execution/:id', component: TourExecutionComponent, canActivate: [roleGuard([0])] } // Tourist only
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }