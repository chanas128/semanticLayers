import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../environments/environment';
import { ConfigService } from './config.service';
import { User } from '../models/user.model';
import { shareReplay } from 'rxjs/operators';





@Injectable({
  providedIn: 'root'
})
export class WebApiCallsService<T> {
  postHttpCall(arg0: string, merchav: number) {
      throw new Error('Method not implemented.');
  }

  ServerURL: string = '';
  server: string = '';
  environmentC = environment;
  configS: any;
  private currentUser$?: Observable<User>;


  constructor(private http: HttpClient,
    private configService: ConfigService) {
    this.configS = this.configService.config;
    console.log(this.configS + " " + environment);

    if (environment.production) {
      this.server = configService.config.server;
      this.ServerURL = environment.serverUrl + "/" + this.server + "/api/";
    }
    else
      this.ServerURL = environment.serverUrl;

    console.log(this.ServerURL);

  }


  post(apiUrl: string, body?: any, queryParams?: HttpParams): Observable<T> {
    return this.http.post<T>(
      this.ServerURL + apiUrl,
      body || {},
      {
        params: queryParams,
        withCredentials: true
      }
    );
  }
  get(apiUrl: string): Observable<T> {
    return this.http.get<T>( this.ServerURL+apiUrl, { withCredentials: true });
  }

  getAll(apiUrl: string): Observable<T[]> {
    return this.http.get<T[]>(this.ServerURL + apiUrl, { withCredentials: true });
  }

  getById(apiUrl: string, id: number | string): Observable<T> {
    return this.http.get<T>(`${this.ServerURL + apiUrl}/${id}`, { withCredentials: true });
  }

  create<T>(apiUrl: string, item: T): Observable<T> {
    return this.http.post<T>(this.ServerURL + apiUrl, item, { withCredentials: true });
  }

  update<T>(apiUrl: string, entity: T): Observable<T> {
    return this.http.post<T>(this.ServerURL + apiUrl, entity, { withCredentials: true });
  }

  delete(apiUrl: string, id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.ServerURL + apiUrl}/${id}`, { withCredentials: true });
  }

  getCurrentUser(): Observable<User> {
  if (!this.currentUser$) {
    const apiUrl = 'users/current';
    this.currentUser$ = this.http
      .get<User>(this.ServerURL + apiUrl, { withCredentials: true })
      .pipe(shareReplay(1));
  }
  return this.currentUser$;
}


  runProcedure<T>(url: string, params?: any): Observable<T> {
  const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true,
    params // Angular ימיר ל-query string אוטומטית
  };
  return this.http.post<T>(this.ServerURL + url, null, httpOptions);
}



}
