import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class CoreService {
  constructor(private _snackBar: MatSnackBar) {}

openSnackBar(message: string, action = 'Fechar', config: { panelClass?: string } = {}) {
  this._snackBar.open(message, action, {
    duration: 5000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
    ...config  // Corrigido aqui
  });
}
}

