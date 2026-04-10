import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private isQuotaError(error: any): boolean {
    const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
    return errorStr.includes('Quota exceeded') || errorStr.includes('resource-exhausted');
  }

  public render() {
    if (this.state.hasError) {
      const isQuota = this.isQuotaError(this.state.error);

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {isQuota ? '일일 사용량 초과' : '오류가 발생했습니다'}
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                {isQuota ? (
                  <>
                    죄송합니다. 현재 서비스의 무료 사용량이 모두 소진되었습니다.<br />
                    내일 다시 정상적으로 이용하실 수 있습니다.<br />
                    <span className="text-amber-500/60 block mt-2">
                      (Firestore Quota Exceeded)
                    </span>
                  </>
                ) : (
                  '애플리케이션을 실행하는 중 예상치 못한 오류가 발생했습니다.'
                )}
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-amber-500 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>다시 시도</span>
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && !isQuota && (
              <div className="mt-8 p-4 bg-black/50 rounded-xl text-left overflow-auto max-h-40">
                <pre className="text-[10px] text-red-400 font-mono">
                  {String(this.state.error)}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
