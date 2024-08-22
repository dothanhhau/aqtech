declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Default
      NODE_ENV: string;

      // Sever
      PORT: number;
      CORS_ORIGIN?: string;
      PREFLIGHT_EXP: number;

      // Database
      POSTGRES_HOST: string;
      POSTGRES_PORT: number;
      POSTGRES_USERNAME: string;
      POSTGRES_PASSWORD: string;
      POSTGRES_DATABASE: string;

      // SENTRY
      SENTRY_DNS: string;
      SENTRY_ENV: string;

      // S3
      AWS_S3_ENABLE: boolean;
      AWS_S3_ACCESS_KEY: string;
      AWS_S3_SECRET_KEY: string;
      AWS_S3_BUCKET: string;
      AWS_S3_IMAGE_PATH: string;

      // File upload
      IMAGE_UPLOAD_LIMIT: string;
      VIDEO_UPLOAD_LIMIT: string;

      // SMTP Server
      SMTP_USER: string;
      SMTP_PASSWORD: string;

      // TypeORM
      QUERY_CACHE_EXPIRATION_TIME: number;

      // User
      ADMIN_NAME: string;
      TEMP_PASSWORD: string;
      DEFAULT_LANGUAGE: string;

      // JWT
      JWT_ACCESS_TOKEN_SECRET: string;
      JWT_ACCESS_TOKEN_EXPIRATION_TIME: string;
      JWT_REFRESH_TOKEN_SECRET: string;
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: string;

      // Date
      MIN_DATE: string;
      MAX_DATE: string;

      // Verification
      VERIFICATION_MINUTE: number;

      // Notification
      ONESIGNAL_APP_ID: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
