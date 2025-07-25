import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:8080/api/events';

@Injectable({
  providedIn: 'root',
})
export class GestaoEventoService {
  constructor(private _http: HttpClient) {}

  add(data: any): Observable<any> {
    console.log('Dados enviados:', data);
    return this._http.post(baseUrl, data); // <-- Removido responseType
  }

  update(id: number, data: any): Observable<any> {
    return this._http.put(`${baseUrl}/${id}`, data); // <-- Removido responseType
  }

  getList(pagina: number = 0, tamanho: number = 10): Observable<any> {
    return this._http.get<any>(`${baseUrl}?page=${pagina}&size=${tamanho}`);
  }

  delete(id: number): Observable<any> {
    return this._http.delete(`${baseUrl}/${id}`, {
      responseType: 'text'
    });
  }
}
