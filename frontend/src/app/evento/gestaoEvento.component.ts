import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/_services';
import { ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { GestaoEventoAddEditComponent } from '@app/evento/gestaoEvento-add-edit.component';
import { GestaoEventoService } from '@app/evento/gestaoEvento.service';
import { CoreService } from '../core/core.service';

import { User } from '@app/_models';

@Component({
selector: 'app-gestaoEvento-list',
templateUrl: 'gestaoEvento.component.html',
styleUrls: ['gestaoEvento.component.scss'],
encapsulation: ViewEncapsulation.None
})
export class GestaoEventoComponent implements OnInit {
    users?: any[];
    user: any;
    displayedColumns: string[] = [
      'id',
      'titulo',
      'descricao',
      'dataEvento',
      'local',
      'action'
    ];

    dataSource = new MatTableDataSource<any>();

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
      private accountService: AccountService,
      private _geService: GestaoEventoService,
      private _dialog: MatDialog,
      private _coreService: CoreService
      ) {this.user = this.accountService.userValue;}

    ngOnInit() {
        this.getList();
        const userData = localStorage.getItem('user');
            if (userData) {
              this.user = JSON.parse(userData);
            }
        this.displayedColumns = ['id','titulo', 'descricao', 'dataEvento', 'local', 'action'];
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();

        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
    }

    openEditForm(data: any) {
      const dialogRef = this._dialog.open(GestaoEventoAddEditComponent, {
        data,
        autoFocus: true,
        restoreFocus: true
      });

      dialogRef.afterClosed().subscribe({
        next: (val) => {
          if (val) {
            this.getList();
          }
        },
      });
    }

    delete(id: number) {
      this._geService.delete(id).subscribe({
        next: (res) => {
          this._coreService.openSnackBar('Evento excluído com sucesso!', 'Fechar', {
                panelClass: 'success-snackbar'
              })
          this.getList();
        },
        error: console.log,
      });
    }

    openAddEditForm() {
      const dialogRef = this._dialog.open(GestaoEventoAddEditComponent);
      dialogRef.afterClosed().subscribe({
        next: (val) => {
          if (val) {
            this.getList();
          }
        },
      });
    }

    getList() {
      this._geService.getList().subscribe({
        next: (res) => {
          this.dataSource = new MatTableDataSource(res.content);
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;
        },
        error: console.log,
      });
    }
}
