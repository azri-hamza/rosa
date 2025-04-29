import { HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';

export type HttpOptions = {
  headers?: HttpHeaders | Record<string, string | string[]>;
  context?: HttpContext;
  observe?: 'body';
  params?: HttpParams | Record<string, string | string[]>;
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
  transferCache?: boolean | { includeHeaders?: string[] };
  // headers?: HttpHeaders | { [header: string]: string | string[] };
  // context?: HttpContext;
  // observe?: 'body' | 'events' | 'response';
  // params?:
  //   | HttpParams
  //   | {
  //       [param: string]:
  //         | string
  //         | number
  //         | boolean
  //         | readonly (string | number | boolean)[];
  //     };
  // reportProgress?: boolean;
  // responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
  // withCredentials?: boolean;
};
