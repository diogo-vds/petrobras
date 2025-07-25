import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';

import { first } from 'rxjs/operators';

import { AccountService } from '@app/_services';

import { ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { UserAddEditComponent } from '@app/users/user-add-edit.component';
import { UsersService } from '@app/_services/users.service';
import { CoreService } from '../core/core.service';

import { User } from '@app/_models';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';


@Component({
selector: 'app-user-list',
templateUrl: 'list.component.html',
styleUrls: ['list.component.scss'],
encapsulation: ViewEncapsulation.None
})
export class ListComponent implements OnInit {
    users?: any[];
    user: any;
    displayedColumns: string[] = [
      'id',
      'nome',
      'email',
      'senha',
      'criado_em',
      'ultimaAlteracao',
      'userAlteracao',
      'perfil_id',
      'action'
    ];

    dataSource = new MatTableDataSource<any>();

    mostrarColunaUserAlteracao = false; // ou true para exibir

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    isMobile = true;

    constructor(
      private accountService: AccountService,
      private _userService: UsersService,
      private _dialog: MatDialog,
      private _coreService: CoreService,
      private breakpointObserver: BreakpointObserver
      ) {
          this.user = this.accountService.userValue;
          this.breakpointObserver.observe([Breakpoints.Handset])
                    .subscribe(result => {
                      this.isMobile = result.matches;
                    });

        }

    ngOnInit() {
        this.getUsuariosList();
        const userData = localStorage.getItem('user');
            if (userData) {
              this.user = JSON.parse(userData);
            }
        this.displayedColumns = ['id','nome', 'email', 'criado_em', 'action'];

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
      const dialogRef = this._dialog.open(UserAddEditComponent, {
        data,
        autoFocus: true,
        restoreFocus: true
      });

      dialogRef.afterClosed().subscribe({
        next: (val) => {
          if (val) {
            this.getUsuariosList();
          }
        },
      });
    }

    deleteUsuario(id: number) {
      this._userService.deleteUsuario(id).subscribe({
        next: (res) => {
          this._coreService.openSnackBar('Usuário excluído com sucesso!', 'Fechar', {
                panelClass: 'success-snackbar'
              })
          this.getUsuariosList();
        },
        error: console.log,
      });
    }

    openAddEditUserForm() {
      const dialogRef = this._dialog.open(UserAddEditComponent);
      dialogRef.afterClosed().subscribe({
        next: (val) => {
          if (val) {
            this.getUsuariosList();
          }
        },
      });
    }

    getUsuariosList() {
      this._userService.getUsuariosList().subscribe({
        next: (res) => {
          this.dataSource = new MatTableDataSource(res);
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;
        },
        error: console.log,
      });
    }



}
