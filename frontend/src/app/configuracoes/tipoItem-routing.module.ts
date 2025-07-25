import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { TipoItemComponent } from './tipoItem.component';
import { TipoItemAddEditComponent } from './tipoItem-add-edit.component';

const routes: Routes = [
    {
        path: '', component: LayoutComponent,
        children: [
            { path: '', component: TipoItemComponent },
            { path: 'add', component: TipoItemAddEditComponent },
            { path: 'edit/:id', component: TipoItemAddEditComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TipoItemRoutingModule { }
