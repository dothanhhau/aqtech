export enum Condition {
  register = 'REGISTER',
  create = 'CREATE',
}

export class FilterRoleDto {
  condition?: Condition;
  // @IsOptional()
  // @IsIn(['CREATE', 'REGISTER'], { message: 'Invalid filter condition' })
  // condition?: 'CREATE' | 'REGISTER';
}
