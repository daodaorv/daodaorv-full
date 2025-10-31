import 'koa';

declare module 'koa' {
  interface Request {
    file?: any;
    files?: any[];
  }

  interface DefaultContext {
    file?: any;
    files?: any[];
    success?: (data?: any) => void;
    error?: (message: string, code?: number) => void;
  }

  interface Context {
    success?: (data?: any) => void;
    error?: (message: string, code?: number) => void;
  }
}

