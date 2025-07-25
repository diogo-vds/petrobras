import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { User } from '@app/_models';

import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AccountService {
    private userSubject: BehaviorSubject<User | null>;
    public user: Observable<User | null>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.userSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('user')!));
        this.user = this.userSubject.asObservable();
    }

    public get userValue() {
        return this.userSubject.value;
    }

    login(username: string, password: string) {
      const url = `${environment.apiUrl}/api/login/${username}/${password}`;
      //console.log('Enviando requisição de login:', url);
      return this.http.post<any>(url, {}, { observe: 'response' }).pipe(
        map(response => {
          if (response.status === 200 && response.body) {
            const user = response.body;
            console.log(`Usuário autenticado: ${user.nome} (ID: ${user.id}) (ID: ${user.perfil_id})`);
            localStorage.setItem('user', JSON.stringify(user));
            this.userSubject.next(user);
            return `Login realizado com sucesso. Bem-vindo, ${user.nome}!`;
          } else {
            return 'Login realizado, mas resposta inesperada.';
          }
        }),
        catchError(err => {
          if (err.status === 401) {
            return throwError(() => 'Credenciais inválidas. Verifique o e-mail e a senha.');
          } else {
            return throwError(() => 'Erro inesperado durante o login. Tente novamente mais tarde.');
          }
        })
      );
    }

    logout() {
        // remove user from local storage and set current user to null
        localStorage.removeItem('user');
        this.userSubject.next(null);
        this.router.navigate(['/account/login']);
    }

    register(user: User) {
        return this.http.post(`${environment.apiUrl}/api/usuarios`, user);
    }

    getAll() {
        const url = `${environment.apiUrl}/api/usuarios`;
        return this.http.get<User[]>(url);
    }

    getById(id: string) {
        return this.http.get<User>(`${environment.apiUrl}/api/usuarios/${id}`);
    }

    update(id: string, params: any) {
        return this.http.put(`${environment.apiUrl}/users/${id}`, params)
            .pipe(map(x => {
                // update stored user if the logged in user updated their own record
                if (id == this.userValue?.id) {
                    // update local storage
                    const user = { ...this.userValue, ...params };
                    localStorage.setItem('user', JSON.stringify(user));

                    // publish updated user to subscribers
                    this.userSubject.next(user);
                }
                return x;
            }));
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/api/usuarios/${id}`)
            .pipe(map(x => {
                // auto logout if the logged in user deleted their own record
                if (id == this.userValue?.id) {
                    this.logout();
                }
                return x;
            }));
    }
}
