import { Injectable } from '@angular/core';

/**
 * Legacy ConfigService — retained for backward compatibility with WebApiCallsService.
 * Not used in the Semantic Layer feature.
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  config: any = { server: '' };
}
