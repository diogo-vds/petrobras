import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';

import { first } from 'rxjs/operators';

import { AccountService } from '@app/_services';

import { ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { TipoItemAddEditComponent } from '@app/configuracoes/tipoItem-add-edit.component';
import { TipoItemService } from '@app/_services/tipoItem.service';
import { CoreService } from '../core/core.service';

import { User } from '@app/_models';

@Component({
selector: 'app-tipoItem-list',
templateUrl: 'tipoItem.component.html',
styleUrls: ['tipoItem.component.scss'],
encapsulation: ViewEncapsulation.None
})
export class TipoItemComponent implements OnInit {
    users?: any[];
    user: any;
    displayedColumns: string[] = [
      'id',
      'descricao',
      'nomeCombo',
      'criado_em',
      'ultimaAlteracao',
      'userAlteracao',
      'action'
    ];

    dataSource = new MatTableDataSource<any>();

    mostrarColunaUserAlteracao = false; // ou true para exibir

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
      private accountService: AccountService,
      private _tipoItemService: TipoItemService,
      private _dialog: MatDialog,
      private _coreService: CoreService
      ) {this.user = this.accountService.userValue;}

    ngOnInit() {
        this.getCombosList();
        const userData = localStorage.getItem('user');
            if (userData) {
              this.user = JSON.parse(userData);
            }
        this.displayedColumns = ['id','nomeCombo', 'descricao', 'criado_em', 'action'];

        if (this.mostrarColunaUserAlteracao) {
          this.displayedColumns.push('userAlteracao');
          this.displayedColumns.push('ultimaAlteracao');
        }
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();

        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
    }

    openEditForm(data: any) {
      const dialogRef = this._dialog.open(TipoItemAddEditComponent, {
        data,
        autoFocus: true,
        restoreFocus: true
      });

      dialogRef.afterClosed().subscribe({
        next: (val) => {
          if (val) {
            this.getCombosList();
          }
        },
      });
    }

    delete(id: number) {
      this._tipoItemService.deleteItem(id).subscribe({
        next: (res) => {
          this._coreService.openSnackBar('Tipo excluído com sucesso!', 'Fechar', {
                panelClass: 'success-snackbar'
              })
          this.getCombosList();
        },
        error: console.log,
      });
    }

    openAddEditUserForm() {
      const dialogRef = this._dialog.open(TipoItemAddEditComponent);
      dialogRef.afterClosed().subscribe({
        next: (val) => {
          if (val) {
            this.getCombosList();
          }
        },
      });
    }


    getCombosList() {
      this._tipoItemService.getItemList().subscribe({
        next: (res) => {
          this.dataSource = new MatTableDataSource(res);
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;
        },
        error: console.log,
      });
    }
}
