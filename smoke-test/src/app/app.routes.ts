import { Routes } from '@angular/router';
import { PostsStubComponent } from './posts-stub/posts-stub.component';

export const routes: Routes = [
  { path: '', component: PostsStubComponent },
  { path: '**', redirectTo: '' },
];
