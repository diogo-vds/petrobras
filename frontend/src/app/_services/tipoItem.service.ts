import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:8080/api/combo';

@Injectable({
  providedIn: 'root',
})
export class TipoItemService {
  constructor(private _http: HttpClient) {}

  addItem(data: any): Observable<any> {
    return this._http.post(baseUrl, data); // <-- Removido responseType
  }

  updateItem(id: number, data: any): Observable<any> {
    console.log('Dados enviados:', data, id);
    return this._http.put(`${baseUrl}/${id}`, data); // <-- Removido responseType
  }

  getItemList(): Observable<any> {
        return this._http.get<any>(baseUrl);
  }

  deleteItem(id: number): Observable<any> {
    return this._http.delete(`${baseUrl}/${id}`, {
      responseType: 'text'
    });
  }
}
