import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CoreService } from '../core/core.service';
import { TipoItemService } from '../_services/tipoItem.service';
import { User } from '@app/_models';
import { AccountService } from '@app/_services';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-users',
  templateUrl: './tipoItem-add-edit.component.html',
  styleUrls: ['./tipoItem-add-edit.component.scss'],
})
export class TipoItemAddEditComponent implements OnInit {
  itemForm: FormGroup;
  user: any;
  education: string[] = [
    'Matric',
    'Diploma',
    'Intermediate',
    'Graduate',
    'Post Graduate',
  ];

  constructor(
    private accountService: AccountService,
    private _fb: FormBuilder,
    private _tipoItemService: TipoItemService,
    private _dialogRef: MatDialogRef<TipoItemService>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _coreService: CoreService
  ) {
    this.user = this.accountService.userValue;
    this.itemForm = this._fb.group({
        nomeCombo: ['', Validators.required],
        descricao: ['', Validators.required],
        userAlteracao: [''],
        criado_em: '',
        ultima_alteracao: '',
    });
  }

hidePassword = true;
loading = false;

togglePasswordVisibility() {
  this.hidePassword = !this.hidePassword;
}

  ngOnInit(): void {
      this.itemForm.patchValue(this.data);
      this.itemForm.patchValue({
        senha: '' // sempre em branco
      });
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const userAlteracao = `[ID: ${user.id}] [NOME: ${user.nome}]`;
        this.itemForm.patchValue({ userAlteracao: userAlteracao });
      }

  }

private tratarErro(err: any) {
  let mensagem = 'Erro inesperado.';

  if (err.status === 409 || err.status === 400) {
    mensagem = err.error?.mensagem || err.error || 'Este e-mail já está em uso.';
  } else if (err.status === 401) {
    mensagem = 'Sessão expirada. Faça login novamente.';
  } else if (err.error) {
    mensagem = typeof err.error === 'string'
      ? err.error
      : err.error?.mensagem || mensagem;
  }

  this._coreService.openSnackBar(mensagem, 'Fechar', {
    panelClass: 'error-snackbar'
  });
}


  onFormSubmit() {
  if (this.itemForm.valid) {
    if (this.data) {
      this._tipoItemService
        .updateItem(this.data.id, this.itemForm.value)
        .subscribe({
          next: (res: any) => {
            console.log('Resposta do servidor:', res.mensagem);
            this._coreService.openSnackBar(res.mensagem, 'Fechar', {
              panelClass: 'success-snackbar'
            });
            this._dialogRef.close(true);
          },
          error: (err: any) => this.tratarErro(err)
        });
    } else {
      this._tipoItemService
        .addItem(this.itemForm.value)
        .subscribe({
          next: (res: any) => {
            console.log('Resposta do servidor:', res.mensagem);
            this._coreService.openSnackBar(res.mensagem, 'Fechar', {
              panelClass: 'success-snackbar'
            });
            this._dialogRef.close(true);
          },
          error: (err: any) => this.tratarErro(err)
        });
    }
  }
}
}
