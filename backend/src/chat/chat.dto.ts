import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsArray()
  history?: Array<{ role: string; parts: Array<{ text: string }> }>;
}
