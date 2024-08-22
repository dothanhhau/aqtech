import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean } from "class-validator";

export class SelectedTuitionsDto {
  @IsBoolean()
  @ApiProperty({ example: false })
  is_select_all: boolean;
  @IsArray()
  @ApiProperty()
  tuition_ids: string[];
}
