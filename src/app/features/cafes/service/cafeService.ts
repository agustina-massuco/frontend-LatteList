import { HttpClient, HttpParams } from '@angular/common/http';
import {Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import CafeModel from '../model/CafeModel';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CafeService {
  private apiUrl = `${environment.apiUrl}/cafes`;
 constructor(private http: HttpClient) { }
 
    getCafes(filtros: any): Observable<any[]> {
        let params = new HttpParams();
        
        if (filtros.delivery === true) {
            params = params.append('delivery', 'true');
        }
        if (filtros.takeaway === true) {
            params = params.append('takeaway', 'true');
        }
        if (filtros.internet_access === true) {
            params = params.append('internet_access', 'true');
        }
        if (filtros.outdoor_seating === true) {
            params = params.append('outdoor_seating', 'true');
        }
        if (filtros.abiertoAhora === true) {
            params = params.append('abiertoAhora', 'true');
        }
        
        if (filtros.search && filtros.search.trim() !== '') {
            params = params.append('search', filtros.search);
        }
        
        return this.http.get<any[]>(this.apiUrl, { params });
    }


    getAllCafes(): Observable<any[]> {
  return this.http.get<any[]>(this.apiUrl);
}

    getCafeById(id: number): Observable<any> {
        
  return this.http.get<any>(`${this.apiUrl}/${id}`);
  
   }

    searchCafes(searchTerm: string): Observable<any[]> {
        const params = new HttpParams().append('search', searchTerm);
        return this.http.get<any[]>(this.apiUrl, { params });
    }

    getCafesByIds(ids: number[]): Observable<CafeModel[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }
    const requests = ids.map(id => 
      this.getCafeById(id).pipe(
        catchError(error => {
          console.error(`Error cargando café ${id}`, error);
          return of(null); 
        })
      )
    );

    return forkJoin(requests).pipe(
      map(results => results.filter(cafe => cafe !== null) as CafeModel[])
    );
  }
}
