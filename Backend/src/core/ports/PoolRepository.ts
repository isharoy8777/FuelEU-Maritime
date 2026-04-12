import { Pool, CreatePoolInput, CreatePoolMemberInput } from '../domain/Pool';

/**
 * PoolRepository Port
 * Defines the contract for pool data persistence.
 * Adapters must implement this interface.
 */
export interface PoolRepository {
  findAll(): Promise<Pool[]>;
  findById(id: string): Promise<Pool | null>;
  findByYear(year: number): Promise<Pool[]>;
  create(data: CreatePoolInput): Promise<Pool>;
  addMember(data: CreatePoolMemberInput): Promise<Pool>;
  delete(id: string): Promise<void>;
}
