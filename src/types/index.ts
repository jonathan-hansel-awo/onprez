// Global type definitions
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
