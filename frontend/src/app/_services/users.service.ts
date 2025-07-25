import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:8080/api/usuarios';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private _http: HttpClient) {}

  addUsuario(data: any): Observable<any> {
    return this._http.post(baseUrl, data); // <-- Removido responseType
  }

  updateUsuario(id: number, data: any): Observable<any> {
    console.log('Dados enviados:', data, id);
    return this._http.put(`${baseUrl}/${id}`, data); // <-- Removido responseType
  }

  getUsuariosList(): Observable<any> {
        return this._http.get<any>(baseUrl);
  }

  deleteUsuario(id: number): Observable<any> {
    return this._http.delete(`${baseUrl}/${id}`, {
      responseType: 'text'
    });
  }

  getPerfis(): Observable<any[]> {
    return this._http.get<any[]>('/api/perfis');
  }

  getPerfisPorTipo(): Observable<any[]> {
    const tipo: string = 'Tipo Perfil';
    return this._http.get<any[]>(`http://localhost:8080/api/combo/${tipo}`);
  }
}
