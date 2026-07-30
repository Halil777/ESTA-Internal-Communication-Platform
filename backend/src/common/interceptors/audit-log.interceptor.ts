import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';

interface AuditRequest {
  method: string;
  url: string;
  user?: {
    id: string;
  };
  ip?: string;
  body?: unknown;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<AuditRequest>();
    const { method, url, user, ip, body } = request;

    const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!writeMethods.includes(method) || !user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        void this.auditService.log({
          adminUserId: user.id,
          action: `${method} ${url}`,
          entityType: url.split('/')[3] ?? 'unknown',
          ipAddress: ip,
          newValue: body ? JSON.stringify(body) : undefined,
        });
      }),
    );
  }
}
