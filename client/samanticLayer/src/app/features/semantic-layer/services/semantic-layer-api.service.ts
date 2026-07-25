import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ─── Models (matching backend DTOs) ────────────────────────────────────────

export interface ConnectionDTO {
  id?: number;
  name: string;
  serverName: string;
  databaseName: string;
  authType: 'SqlServer' | 'Windows';
  username?: string;
  password?: string;
  isActive?: boolean;
  createdAt?: string;
  lastTestedAt?: string;
  lastTestResult?: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

export interface SLColumn {
  name: string;
  displayName: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  min?: string;
  max?: string;
  distinctCount?: number;
  businessDescription?: string;
  source: string;
  customValues?: { [key: string]: string };
}

export interface SLTable {
  name: string;
  displayName: string;
  description?: string;
  columns: SLColumn[];
}

export interface SLRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: string;
  confirmed: boolean;
}

export interface SemanticLayerDefinition {
  connectionId: string;
  databaseName: string;
  lastSyncedAt: string;
  tables: SLTable[];
  relationships: SLRelationship[];
  customFields?: { id: string; name: string; key: string }[];
}

export interface QueryRequest {
  connectionId: number;
  tableName: string;
  selectedColumns: string[];
  filters: QueryFilter[];
  maxRows: number;
}

export interface QueryFilter {
  column: string;
  operator: string;
  value: string;
  valueTo?: string;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  totalRows: number;
  generatedSql: string;
}

// ─── Service ───────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SemanticLayerApiService {

  private baseUrl = 'http://localhost:5286/api'; // matches launchSettings.json

  constructor(private http: HttpClient) {}

  // ── Connections ──────────────────────────────────────────────

  getConnections(): Observable<ConnectionDTO[]> {
    return this.http.get<ConnectionDTO[]>(`${this.baseUrl}/connections`);
  }

  getConnection(id: number): Observable<ConnectionDTO> {
    return this.http.get<ConnectionDTO>(`${this.baseUrl}/connections/${id}`);
  }

  createConnection(dto: ConnectionDTO): Observable<ConnectionDTO> {
    return this.http.post<ConnectionDTO>(`${this.baseUrl}/connections`, dto);
  }

  testConnection(id: number): Observable<TestConnectionResult> {
    return this.http.post<TestConnectionResult>(`${this.baseUrl}/connections/${id}/test`, {});
  }

  scanConnection(id: number): Observable<SemanticLayerDefinition> {
    return this.http.post<SemanticLayerDefinition>(`${this.baseUrl}/connections/${id}/scan`, {});
  }

  deleteConnection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/connections/${id}`);
  }

  // ── Semantic Layer ──────────────────────────────────────────

  getSemanticLayer(connectionId: number): Observable<SemanticLayerDefinition> {
    return this.http.get<SemanticLayerDefinition>(`${this.baseUrl}/semantic-layer/${connectionId}`);
  }

  updateSemanticLayer(connectionId: number, layer: SemanticLayerDefinition): Observable<SemanticLayerDefinition> {
    return this.http.put<SemanticLayerDefinition>(`${this.baseUrl}/semantic-layer/${connectionId}`, layer);
  }

  exportJson(connectionId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/semantic-layer/${connectionId}/export`, {
      responseType: 'blob'
    });
  }

  // ── Data Display / Query ────────────────────────────────────

  executeQuery(request: QueryRequest): Observable<QueryResult> {
    return this.http.post<QueryResult>(`${this.baseUrl}/data/query`, request);
  }
}
