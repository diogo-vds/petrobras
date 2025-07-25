import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CoreService } from '../core/core.service';
import { GestaoEventoService } from '@app/evento/gestaoEvento.service';
import { User } from '@app/_models';
import { AccountService } from '@app/_services';
import { Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-users',
  templateUrl: './gestaoEvento-add-edit.component.html',
  styleUrls: ['./gestaoEvento-add-edit.component.scss'],
})
export class GestaoEventoAddEditComponent implements OnInit {
  geForm: FormGroup;
  user: any;

  constructor(
    private accountService: AccountService,
    private _fb: FormBuilder,
    private _geService: GestaoEventoService,
    private _dialogRef: MatDialogRef<GestaoEventoAddEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _coreService: CoreService,
    private datePipe: DatePipe
  ) {
    this.user = this.accountService.userValue;
    this.geForm = this._fb.group({
      titulo: ['', Validators.required],
      descricao: ['', Validators.required],
      dataEventoData: ['', Validators.required], // campo de data
      dataEventoHora: ['', Validators.required], // campo de hora
      local: ['', Validators.required],
    });
  }

  ngOnInit(): void {
      this.geForm.patchValue(this.data);
      this.geForm.patchValue({
        senha: '' // sempre em branco
      });
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const userAlteracao = `[ID: ${user.id}] [NOME: ${user.nome}]`;
        this.geForm.patchValue({ userAlteracao: userAlteracao });
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
    if (this.geForm.valid) {
      const formValue = this.geForm.value;

      const data = formValue.dataEventoData; // pode ser string ou Date
      const hora = formValue.dataEventoHora; // string: "HH:mm"

      let dataEvento: string | null = null;

      if (data && hora) {
        const [hours, minutes] = hora.split(':').map(Number);
        const dataObj = new Date(data);

        if (!isNaN(dataObj.getTime())) {
          dataObj.setHours(hours);
          dataObj.setMinutes(minutes);
          dataObj.setSeconds(0);
          dataObj.setMilliseconds(0);

          //dataEvento = dataObj.toISOString();

          dataEvento = this.datePipe.transform(dataObj, 'yyyy-MM-dd HH:mm:ss', 'pt-BR');
        } else {
          this._coreService.openSnackBar('Data inválida selecionada.', 'Fechar', {
            panelClass: 'error-snackbar'
          });
          return;
        }
      } else {
        this._coreService.openSnackBar('Preencha a data e hora do evento.', 'Fechar', {
          panelClass: 'error-snackbar'
        });
        return;
      }

      // Cria payload final
      const payload = {
        ...formValue,
        dataEvento: dataEvento
      };

      delete payload.dataEventoData;
      delete payload.dataEventoHora;

      // Envia para o serviço
      if (this.data) {
        this._geService.update(this.data.id, payload).subscribe({
          next: (res: any) => {
            this._coreService.openSnackBar(res.mensagem, 'Fechar', {
              panelClass: 'success-snackbar'
            });
            this._dialogRef.close(true);
          },
          error: (err: any) => this.tratarErro(err)
        });
      } else {
        this._geService.add(payload).subscribe({
          next: (res: any) => {
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
