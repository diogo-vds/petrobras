import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { TipoItemRoutingModule } from './tipoItem-routing.module';
import { LayoutComponent } from './layout.component';
import { TipoItemComponent } from './tipoItem.component';
import { TipoItemAddEditComponent } from './tipoItem-add-edit.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TipoItemRoutingModule,
        SharedModule
    ],
    declarations: [
        LayoutComponent,
        TipoItemComponent,
        TipoItemAddEditComponent
    ]
})
export class TipoItemModule { }
