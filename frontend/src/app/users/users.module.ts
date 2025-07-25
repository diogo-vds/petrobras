import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { LayoutComponent } from './layout.component';
import { ListComponent } from './list.component';
import { UserAddEditComponent } from './user-add-edit.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        UsersRoutingModule,
        SharedModule
    ],
    declarations: [
        LayoutComponent,
        ListComponent,
        UserAddEditComponent
    ]
})
export class UsersModule { }
