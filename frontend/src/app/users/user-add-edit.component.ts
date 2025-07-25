import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CoreService } from '../core/core.service';
import { UsersService } from '../_services/users.service';
import { User } from '@app/_models';
import { AccountService } from '@app/_services';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-users',
  templateUrl: './user-add-edit.component.html',
  styleUrls: ['./user-add-edit.component.scss'],
})
export class UserAddEditComponent implements OnInit {
  userForm: FormGroup;
  user: any;

  constructor(
    private accountService: AccountService,
    private _fb: FormBuilder,
    private _userService: UsersService,
    private _dialogRef: MatDialogRef<UserAddEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _coreService: CoreService
  ) {
    this.user = this.accountService.userValue;
    this.userForm = this._fb.group({
        nome: ['', Validators.required],
        email: [
                  '',
                  [
                    Validators.required,
                    Validators.email,
                    Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)
                  ]
                ],
        senha: [
                  '',
                  [
                    Validators.minLength(8),
                    Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/)
                  ]
                ],
        perfil_id: ['', Validators.required],
        userAlteracao: [''],
        criado_em: '',
        ultima_alteracao: '',
    });
  }

hidePassword = true;
loading = false;
perfis: any[] = [];

togglePasswordVisibility() {
  this.hidePassword = !this.hidePassword;
}

  ngOnInit(): void {
      this.userForm.patchValue(this.data);
      this.userForm.patchValue({
        senha: '' // sempre em branco
      });
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const userAlteracao = `[ID: ${user.id}] [NOME: ${user.nome}]`;
        this.userForm.patchValue({ userAlteracao: userAlteracao });
      }
      this.carregarPerfis();
  }

  carregarPerfis(): void {
  this._userService.getPerfisPorTipo().subscribe({
    next: (res) => {
      this.perfis = res;
    },
    error: (err: any) => {
      console.error('Erro ao carregar perfis:', err);
    }
  });
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
  if (this.userForm.valid) {
    if (this.data) {
      this._userService
        .updateUsuario(this.data.id, this.userForm.value)
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
      this._userService
        .addUsuario(this.userForm.value)
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
