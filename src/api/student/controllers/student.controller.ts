import { IsCreatorGuard } from '@/api/auth/guards/is-creator.guard';
import { JwtAccessGuard } from '@/api/auth/guards/jwt-access.guard';
import { SentryInterceptor } from '@/common/interceptors';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { StudentService } from '../services/student.service';
import { CreateStudentDto, DeleteStudentsDto, FilterOfficeDto, UpdateStudentDto } from '../dto/crud-students-dto';
import { HttpRequest } from '@/shared/http/request.interface';

@UseInterceptors(SentryInterceptor)
@ApiTags('Student')
@Controller('student')
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, IsCreatorGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('list-student')
  list(@Query() query: FilterOfficeDto) {
    return this.studentService.lists(query);
  }

  @Get('student/:id')
  studentDetail(@Param('id') id: string) {
    return this.studentService.studentDetail(id);
  }

  @Post('create-student')
  async createStudents(@Body() student: CreateStudentDto) {
    return await this.studentService.createStudents(student);
  }

  @Put('update-student/:id')
  async updateStudent(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return await this.studentService.updateStudent(id, updateStudentDto);
  }

  @Delete('delete-student')
  async deleteStudents(@Body() deleteStudentsDto: DeleteStudentsDto, @Request() req: HttpRequest) {
    return await this.studentService.deleteStudents(deleteStudentsDto.ids, req.user);
  }
}
