import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { GestaoEventoRoutingModule } from './gestaoEvento-routing.module';
import { LayoutComponent } from './layout.component';
import { GestaoEventoComponent } from './gestaoEvento.component';
import { GestaoEventoAddEditComponent } from './gestaoEvento-add-edit.component';
import { SharedModule } from '../shared/shared.module';
import { DatePipe } from '@angular/common';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        GestaoEventoRoutingModule,
        SharedModule
    ],
    declarations: [
        LayoutComponent,
        GestaoEventoComponent,
        GestaoEventoAddEditComponent
    ],
    providers: [
        DatePipe
    ]
})
export class GestaoEventoModule { }
