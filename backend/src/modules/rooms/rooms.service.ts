import { deleteRowById, insertRow, selectAllRows, selectRowById, updateRowById } from '../../repositories/postgresCrud';
import { Room, CreateRoomInput, UpdateRoomInput } from './rooms.types';

export async function getRooms() {
  return selectAllRows<Room>('rooms');
}

export async function getRoomById(id: string) {
  return selectRowById<Room>('rooms', id);
}

export async function createRoom(input: CreateRoomInput) {
  return insertRow<Room>('rooms', input as Record<string, unknown>);
}

export async function updateRoom(id: string, input: UpdateRoomInput) {
  return updateRowById<Room>('rooms', id, input as Record<string, unknown>);
}

export async function deleteRoom(id: string) {
  await deleteRowById('rooms', id);
}
