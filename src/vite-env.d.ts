/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API Gateway 基础地址，例如 https://xxx.execute-api.ap-northeast-1.amazonaws.com */
  readonly VITE_API_BASE_URL?: string
  /** 当前部署环境：dev / stg / prod，本地开发未注入时为 local */
  readonly VITE_APP_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
