import { Injectable, signal } from '@angular/core';
import List from '../model/List';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  
  private apiUrl = 'http://localhost:8080/listas'; 

  userLists = signal<List[]>([]);
  publicLists = signal<List[]>([]);

  constructor(private http: HttpClient) {}


   getListById(id: number): Observable<List> {
      return this.http.get<List>(`${this.apiUrl}/${id}`);
  }

  getUserLists(): Observable<List[]> {
    return this.http.get<List[]>(`${this.apiUrl}/mis-listas`).pipe(
      tap(lists => this.userLists.set(lists))
    );
  }

  getPublicLists(): Observable<List[]> {
    return this.http.get<List[]>(`${this.apiUrl}/publicas`).pipe(
      tap(lists => this.publicLists.set(lists))
    );
  }

  postList(nombre: string): Observable<List> {
    return this.http.post<List>(this.apiUrl, { nombre }).pipe(
      tap(() => {
         this.getUserLists().subscribe();
      })
    );
  }

   putList(list: List): Observable<List> {
      return this.http.put<List>(`${this.apiUrl}/${list.id}`, list).pipe(
          tap(() => {
             this.getUserLists().subscribe(); 
          })
      );
  }

   cloneList(id: number): Observable<List> {
      return this.http.post<List>(`${this.apiUrl}/${id}/clonar`, {}).pipe(
          tap(() => {
              this.getUserLists().subscribe(); 
          })
      );
  }

  deleteList(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.userLists.update(lists => lists.filter(l => l.id !== id));
      })
    );
  }

  toggleVisibility(listId: number, publica: boolean): Observable<void> {
      return this.http.patch<void>(`${this.apiUrl}/${listId}/visibilidad`, { publica }).pipe(
          tap(() => {
              this.userLists.update(lists => 
                  lists.map(l => l.id === listId ? { ...l, publica: publica } : l)
              );
              if (this.publicLists().length > 0) {
                  this.getPublicLists().subscribe();
              }
          })
      );
  }

  toggleCafe(listId: number, cafeId: number, agregar: boolean): Observable<void> {
    const url = `${this.apiUrl}/${listId}/cafes/${cafeId}`;

    const request$ = agregar
      ? this.http.post<void>(url, {})
      : this.http.delete<void>(url);

    return request$.pipe(
      tap(() => {
        this.getUserLists().subscribe();
      })
    );
  }


}
