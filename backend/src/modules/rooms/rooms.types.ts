export interface Room {
  id: string;
  created_at?: string;
  [key: string]: unknown;
}

export type CreateRoomInput = Omit<Room, 'id' | 'created_at'>;
export type UpdateRoomInput = Partial<CreateRoomInput>;
