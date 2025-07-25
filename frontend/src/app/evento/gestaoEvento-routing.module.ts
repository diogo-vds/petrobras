import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { GestaoEventoComponent } from './gestaoEvento.component';
import { GestaoEventoAddEditComponent } from './gestaoEvento-add-edit.component';

const routes: Routes = [
    {
        path: '', component: LayoutComponent,
        children: [
            { path: '', component: GestaoEventoComponent },
            { path: 'add', component: GestaoEventoAddEditComponent },
            { path: 'edit/:id', component: GestaoEventoAddEditComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class GestaoEventoRoutingModule { }
