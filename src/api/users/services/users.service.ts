import { MediaService } from '@/api/media/services/media.service';
import { TypeGender, TypeSensMail, TypeUser } from '@/common/enum';
import { generatedKey } from '@/common/generatedKey';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { UserPayload } from '@/shared/http/request.interface';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import _, { forEach } from 'lodash';
import { Repository } from 'typeorm';
import { GenerateEntityHelper } from '../../../shared/generate-entity';
import { NewChangePassword } from '../../auth/dto/new_change_password.dto';
import {
  ChangePasswordRequest,
  CreateUserVerification,
  FilterUserDto,
  ActiveUserDto,
  CreateNewUser,
  RequestUser,
  OrderBy,
  SortBy,
  ResetPassWord,
} from '../dto';
import { ResponseUser } from '../viewmodels/response/user.response';
import {
  Device,
  Language,
  Office,
  Permission,
  Role,
  RolePermission,
  Student,
  User,
  UserLanguage,
  UserRole,
  UserVerification,
} from '@/database/entity';
import { dynamicSort, paginate, removeAccents, sortByFirstname, sortName } from '../../../shared/utility';
import { SMSClient } from '../../../common/client_services/sms-client';
import { UploadVideoDto } from '../dto/upload-video.dto';
import { ImageHelper } from '../../../shared/image';
import * as fs from 'fs';
import AWS from 'aws-sdk';
import path from 'path';
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
import * as util from 'util';
import ThumbnailGenerator from 'video-thumbnail-generator';
import { UpdateLanguageRequest } from '../dto/update-language-user.dto';
const getDimensions = require('get-video-width-height');
import { plainToClass } from 'class-transformer';
import { InitData } from '@/common/create-data/init-data';
import { CheckSocialDto, RegisterDto } from '@/api/auth/dto/register.dto';
import { endOfQuarter, startOfQuarter } from 'date-fns';
const diacritics = require('diacritics');
import { mapUserToPersonal, mapUserToKOLDetail } from '../mapper/user-profile.mapper';
import {} from '../mapper/user-profile.mapper';
import { Response } from 'express';
import { Workbook } from 'exceljs';
import * as XLSX from 'xlsx';
import { UpdateProfileDto, UpdateUserDto } from '../dto/update-user.dto';
@Injectable()
export class UsersService {
  private readonly s3: AWS.S3;
  constructor(
    @InjectRepository(User, 'postgres') private readonly userRepository: Repository<User>,
    @InjectRepository(Permission, 'postgres') private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role, 'postgres') private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission, 'postgres') private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRole, 'postgres') private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Language, 'postgres') private readonly languageRepository: Repository<Language>,
    @InjectRepository(UserLanguage, 'postgres') private readonly userLanguageRepository: Repository<UserLanguage>,
    @InjectRepository(Device, 'postgres') private readonly deviceRepository: Repository<Device>,
    @InjectRepository(UserVerification, 'postgres')
    private readonly userVerificationRepository: Repository<UserVerification>,
    @InjectMapper() private readonly classMapper: Mapper,
    private mediaService: MediaService,
    private config: ConfigService,
    private smsClient: SMSClient,
    private initData: InitData,
    private imageHelper: ImageHelper,
    private generateEntity: GenerateEntityHelper,
    @InjectRepository(User, 'postgres') private readonly usersRepository: Repository<User>,
    @InjectRepository(Office, 'postgres') private readonly officeRepository: Repository<Office>,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: config.get('AWS_S3_ACCESS_KEY'),
      secretAccessKey: config.get('AWS_S3_SECRET_KEY'),
    });
  }

  async updateNewUser(dto: NewChangePassword) {
    const user = await this.userRepository.findOneBy({ username: dto.username });
    if (!user || user == null) {
      throw new HttpException(ErrorCode.user_already_exist, HttpStatus.BAD_REQUEST);
    }

    user.is_need_change_password = false;
    user.password = await generatedKey.refTemp(dto.new_password);
    // user.active = true
    // user.active_date = new Date()
    await this.userRepository.save(user);
    const deleteUserVerification = await this.userVerificationRepository.findBy({
      username: dto.username,
      otp: dto.verification_code,
    });

    if (deleteUserVerification) {
      await this.userVerificationRepository.remove(deleteUserVerification);
    }

    return user;
    // return this.classMapper.map(user, User, ResponseUser);
  }

  /**
   * Register user
   * @param refuser
   * @param createDto
   * @returns
   */
  async register(registerDto: RegisterDto) {
    const type = registerDto.type ? registerDto.type : 'local';
    let id = await this.generateEntity.genId(this.userRepository, 'users');
    registerDto.password = this.smsClient.generateRandomString(8);
    let password = await generatedKey.refTemp(registerDto.password);

    const existUser = await this.findByUserName(registerDto.username);
    if (existUser != null) {
      if (!existUser.active) {
        throw new HttpException(ErrorCode.user_has_been_suspended, HttpStatus.FORBIDDEN);
      }

      throw new HttpException(ErrorCode.user_already_exist, HttpStatus.BAD_REQUEST);
    }

    const username = registerDto.username;
    let user = null;
    user = this.userRepository.create({
      ...registerDto,
      id,
      username,
      password,
      email: username,
      type: type,
      is_need_change_password: false,
    });
    await this.userRepository.save(user);

    // Create UserRole
    let roleName = registerDto.role ? registerDto.role : TypeUser.Staff; // level low
    const role = await this.getRoleByName(roleName);
    const userRole = this.userRoleRepository.create({
      id: generatedKey.ref(32),
      role_id: role.id,
      user_id: id,
    });
    await this.userRoleRepository.save(userRole);

    // Create UserLanguage
    const defaultLanguage = await this.getLanguage(this.config.get('DEFAULT_LANGUAGE'));
    const userLanguage = this.userLanguageRepository.create({
      id: generatedKey.ref(32),
      language_id: defaultLanguage.id,
      user_id: id,
    });
    await this.userLanguageRepository.save(userLanguage);

    const requestUserDto: CreateUserVerification = {
      username: registerDto.username,
      email: registerDto.username,
    };

    const isLocal = registerDto.type !== 'local';
    // await this.createUserVerification(requestUserDto, 'CREATE', isLocal);

    return user;
    // return this.classMapper.map(user, User, ResponseUser);
  }

  /**
   * Create new user with role
   * @param refuser
   * @param createDto
   * @returns
   */
  async create(userReq: UserPayload, createDto: CreateNewUser) {
    let haveType = 'local';
    let id = await this.generateEntity.genId(this.userRepository, 'users');
    // const password = await this.smsClient.generateRandomString(8);
    const password = Math.floor(100000 + Math.random() * 899999).toString();
    const generatePass = await generatedKey.refTemp(password);

    if ((await this.findByUserName(createDto.email)) != null) {
      throw new HttpException(ErrorCode.user_already_exist, HttpStatus.BAD_REQUEST);
    }

    const username = createDto.email;
    let user = null;

    user = this.userRepository.create({
      ...createDto,
      id,
      username,
      password: generatePass,
      type: haveType,
      is_need_change_password: false,
      create_by: userReq.userId,
      active: true,
    });
    await this.userRepository.save(user);

    // Create UserRole
    let roleName = createDto.role ? createDto.role : 'staff';
    const role = await this.getRoleByName(roleName);
    const userRole = this.userRoleRepository.create({
      id: generatedKey.ref(32),
      role_id: role.id,
      user_id: id,
    });
    await this.userRoleRepository.save(userRole);

    // Create UserLanguage
    const defaultLanguage = await this.getLanguage(this.config.get('DEFAULT_LANGUAGE'));
    const userLanguage = this.userLanguageRepository.create({
      id: generatedKey.ref(32),
      language_id: defaultLanguage.id,
      user_id: id,
    });
    await this.userLanguageRepository.save(userLanguage);

    const requestUserDto: CreateUserVerification = {
      username: username,
      email: username,
    };
    await this.createUserVerification(requestUserDto, 'CREATE', true, password);

    // Create RolePermission
    // if (role.name == 'admin') {
    //   const permissions = await this.permissionRepository.find();
    //   for (let i = 0; i < permissions.length; i++) {
    //     const rolePermission = this.rolePermissionRepository.create({
    //       id: generatedKey.ref(32),
    //       role_id: role.id,
    //       permission_id: permissions[i].id,
    //     });

    //     await this.rolePermissionRepository.save(rolePermission);
    //   }
    // } else {
    //   const permission = await this.permissionRepository.findOneBy({ name: 'Read' });
    //   const rolePermission = this.rolePermissionRepository.create({
    //     id: generatedKey.ref(32),
    //     role_id: role.id,
    //     permission_id: permission.id,
    //   });

    //   await this.rolePermissionRepository.save(rolePermission);
    // }

    return user;
    // return this.classMapper.map(user, User, ResponseUser);
  }

  async createAccountSocial(createDto: CreateNewUser, haveType: string) {
    let id = await this.generateEntity.genId(this.userRepository, 'users');
    const password = await this.smsClient.generateRandomString(8);
    const generatePass = await generatedKey.refTemp(password);

    if ((await this.findByUserName(createDto.email)) != null) {
      throw new HttpException(ErrorCode.user_already_exist, HttpStatus.BAD_REQUEST);
    }

    const username = createDto.email;
    let user = null;

    user = this.userRepository.create({
      ...createDto,
      id,
      username,
      password: generatePass,
      type: haveType,
      is_need_change_password: false,
    });
    await this.userRepository.save(user);

    // Create UserRole
    let roleName = createDto.role ? createDto.role : 'staff';
    const role = await this.getRoleByName(roleName);
    const userRole = this.userRoleRepository.create({
      id: generatedKey.ref(32),
      role_id: role.id,
      user_id: id,
    });
    await this.userRoleRepository.save(userRole);

    // Create UserLanguage
    const defaultLanguage = await this.getLanguage(this.config.get('DEFAULT_LANGUAGE'));
    const userLanguage = this.userLanguageRepository.create({
      id: generatedKey.ref(32),
      language_id: defaultLanguage.id,
      user_id: id,
    });
    await this.userLanguageRepository.save(userLanguage);
    return user;
  }

  /**
   * Get a user by ID
   * @param id
   * @returns
   */
  async retrieve(id: string) {
    // : Promise<ResponseUser>
    const user = await this.userRepository.findOneBy({ id, delete: false });
    if (!user) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    return user;
    // return this.classMapper.map(user, User, ResponseUser);
  }

  /**
   *
   * @param user
   * @returns
   */
  reponseUser(user: User) {
    const userResponse = _.omit(user, 'password');

    return userResponse;
  }

  /**
   * Update user profile
   * @param id
   * @param UpdateProfileDto
   * @returns
   */
  async updateProfile(id: string, updateDto: UpdateProfileDto) {
    // let user = await this.userRepository.findOneBy({ id, delete: false });
    // if (!user) {
    //   throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    // }

    let user = await this.userRepository.findOne({
      where: { id, delete: false },
      relations: ['office'],
    });
    if (!user) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    if (updateDto.full_avatar && user.full_avatar) {
      // await this.mediaService.deleteFile(user.full_avatar);
      user.avatar = this.mediaService.getSmallImage(updateDto.full_avatar);
    }
    user.update_date = new Date();
    user = await this.userRepository.save({ ...user, ...updateDto });

    return this.retrieve(id);
  }

  /**
   * Update user info
   * @param id
   * @param updateDto
   * @returns
   */

  // async getOfficeNames(): Promise<string[]> {
  //   const offices = await this.officeRepository.find({ select: ['name'] });
  //   return offices.map(office => office.name);
  // }

  async updateUser(id: string, userReq: any, updateDto: UpdateUserDto) {
    // check user exist
    let user = await this.userRepository.findOneBy({ id, delete: false });
    if (!user) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    const checkCodeExited = await this.userRepository
      .createQueryBuilder('user')
      .where('user.code = :code', { code: updateDto.code })
      .andWhere('user.delete = :delete', { delete: false })
      .andWhere('user.id != :id', { id: user.id })
      .getOne();
    if (checkCodeExited) {
      throw new HttpException(ErrorCode.user_code_already_exist, HttpStatus.BAD_REQUEST);
    }

    const checkEmailExited = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email: updateDto.email })
      .andWhere('user.delete = :delete', { delete: false })
      .andWhere('user.id != :id', { id: user.id })
      .getOne();
    if (checkEmailExited) {
      throw new HttpException(ErrorCode.user_email_already_exist, HttpStatus.BAD_REQUEST);
    }

    // update role
    if (updateDto.roles) {
      const newRoleIds = [];
      for (const roleName of updateDto.roles) {
        const role = await this.getRoleByName(roleName);
        if (!role) {
          throw new HttpException(ErrorCode.role_not_existed, HttpStatus.NOT_FOUND);
        }
        newRoleIds.push(role.id);
      }
      await Promise.all(
        newRoleIds.map(async (newRoleId) => {
          const role = await this.roleRepository.findOneBy({ id: newRoleId });
          if (!role) {
            throw new HttpException(ErrorCode.role_not_existed, HttpStatus.NOT_FOUND);
          }

          if (!userReq.roleNames.includes(TypeUser.Admin) && role.name === TypeUser.Admin) {
            throw new HttpException(ErrorCode.not_allow_update_to_admin_role, HttpStatus.BAD_REQUEST);
          }
        }),
      );

      const currentRoles = await this.userRoleRepository.findBy({ user_id: id });
      const currentRoleIds = currentRoles.map((role) => role.role_id);

      const rolesToAdds = newRoleIds.filter((roleId) => !currentRoleIds.includes(roleId));
      await Promise.all(
        rolesToAdds.map(async (roleId) => {
          const userRole = this.userRoleRepository.create({ id: generatedKey.ref(32), user_id: id, role_id: roleId });
          await this.userRoleRepository.save(userRole);
        }),
      );

      const rolesToRemoves = currentRoleIds.filter((roleId) => !newRoleIds.includes(roleId));
      await Promise.all(
        rolesToRemoves.map(async (roleId) => {
          await this.userRoleRepository.delete({ user_id: id, role_id: roleId });
        }),
      );
    }

    if (updateDto.full_avatar && user.full_avatar) {
      // await this.mediaService.deleteFile(user.full_avatar);
      user.avatar = this.mediaService.getSmallImage(updateDto.full_avatar);
    }

    if (updateDto.officer_number) {
      user.officer_number = updateDto.officer_number;
    }

    if (updateDto.derpartment_name) {
      user.department_name = updateDto.derpartment_name;
    }

    if (updateDto.office_id) {
      const office = await this.officeRepository.findOneBy({ id: updateDto.office_id });
      if (!office) {
        throw new HttpException('Office not found', HttpStatus.NOT_FOUND);
      }
      user.office = office;
    }

    user.update_date = new Date();
    user = await this.userRepository.save({ ...user, ...updateDto });

    return this.retrieve(id);
  }

  /**
   * Set delete flag for a user
   * @param userId
   * @returns
   */
  async active(userId: string, userReq: any, activeUser: ActiveUserDto) {
    const user = await this.userRepository.findOneBy({ id: userId, delete: false });
    if (!user) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    user.active = activeUser.active;
    if (user.active) {
      user.active_date = new Date();
    }
    user.update_by = userReq.userId;
    user.update_date = new Date();
    await this.userRepository.save(user);
    return user;
  }

  /**
   * Get user by username
   * @param username
   * @returns
   */
  async getMe(userId: string, username: string) {
    //: Promise<User>
    const user = await this.userRepository
      .createQueryBuilder('users')
      .addSelect('users.create_date')
      .leftJoinAndSelect('users.userRoles', 'user_role', 'user_role.delete = :del', { del: false })
      .leftJoinAndSelect('user_role.role', 'role')
      .leftJoinAndSelect('users.userLanguages', 'user_language', 'user_language.delete = :del', { del: false })
      .leftJoinAndSelect('user_language.language', 'language')
      // .leftJoinAndSelect('users.userSocials', 'social', 'social.delete = :del AND social.user_id = :userId', {
      //   del: false,
      //   userId,
      // })
      // .leftJoinAndSelect('social.socialDetails', 'social_detail')
      // .leftJoinAndSelect('users.department', 'department', ' department.delete = :del', { del: false })
      // .leftJoinAndSelect('users.studio', 'studio', ' studio.delete = :del', { del: false })
      .leftJoinAndSelect('users.office', 'office', 'office.id = users.office_id')
      .addSelect(['office.id', 'office.name'])
      .where({ username, delete: false })
      .orderBy('user_language.create_date', 'DESC')
      .getOne();

    if (user) {
      user.roles = user.userRoles.map((userRole) => userRole.role.name);
      delete user.userRoles;

      user.language = user.userLanguages.length > 0 ? user.userLanguages[0].language.language : null;
      delete user.userLanguages;

      user.office_name = user.office ? user.office.name : null;
      delete user.office;
    }

    let responseUser = plainToClass(ResponseUser, user);
    if (user.roles.includes(TypeUser.Admin)) {
      responseUser.active_date = user.create_date;
    }
    // responseUser.active_time = user.create_date;
    const userVerification = await this.userVerificationRepository.findOneBy({
      username: username,
      delete: false,
      type: 'CREATE',
    });
    if (userVerification) {
      // responseUser.active_time = userVerification.update_date;
    }

    return responseUser;
  }

  /**
   * Get user by id
   * @param id
   * @returns
   */
  async getUserDetail(id: string) {
    const user = await this.userRepository
      .createQueryBuilder('users')
      .addSelect('users.create_date')
      .leftJoinAndSelect('users.userRoles', 'user_role', 'user_role.delete = :del', { del: false })
      .leftJoinAndSelect('user_role.role', 'role')
      .leftJoinAndSelect('users.userLanguages', 'user_language', 'user_language.delete = :del', { del: false })
      .leftJoinAndSelect('user_language.language', 'language')
      .leftJoinAndSelect('users.office', 'office', 'office.id = users.office_id')
      .addSelect(['office.id', 'office.name'])
      // .leftJoinAndSelect('users.userSocials', 'social', 'social.delete = :del', { del: false })
      // .leftJoinAndSelect('social.socialDetails', 'social_detail')
      // .leftJoinAndSelect('users.department', 'department', ' department.delete = :del', { del: false })
      // .leftJoinAndSelect('users.studio', 'studio', ' studio.delete = :del', { del: false })
      .where({ id, delete: false })
      .orderBy('user_language.create_date', 'DESC')
      .getOne();

    if (user) {
      user.roles = user.userRoles.map((userRole) => userRole.role.name);
      delete user.userRoles;

      user.language = user.userLanguages.length > 0 ? user.userLanguages[0].language.language : null;
      delete user.userLanguages;

      user.office_name = user.office ? user.office.name : null;
      delete user.office;
    }

    return plainToClass(ResponseUser, user);
  }

  /**
   *
   * @param username
   * @returns
   */
  async findByUserName(username: string): Promise<User | undefined> {
    // await this.createSeedData();
    return await this.userRepository.findOneBy({ username, delete: false });
  }

  async queryUser(username: string, userid: string): Promise<User | undefined> {
    const condition = {};
    if (username) {
      condition['username'] = username;
    } else {
      condition['id'] = userid;
    }

    let queryBuilder = this.userRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.userRoles', 'user_role')
      .leftJoinAndSelect('user_role.role', 'role')
      .where(condition);
    return await queryBuilder.getOne();
  }

  /**
   *
   * @param phone
   * @returns
   */
  async findByPhone(phone: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ phone, delete: false });
    return user;
  }

  /**
   *
   * @returns
   */
  getDefaultQueryBuilder() {
    return this.userRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.userRoles', 'user_role')
      .leftJoinAndSelect('user_role.role', 'role')
      .leftJoinAndSelect('role.rolePermissions', 'role_permission')
      .leftJoinAndSelect('role_permission.permission', 'permission');
  }

  /**
   * Create seed data
   */
  async createSeedData() {
    // Create role
    if ((await this.roleRepository.find()).length == 0) {
      const roles = [
        {
          id: generatedKey.ref(32),
          name: 'admin',
          description: 'Admin',
          priority: 1,
        },
        {
          id: generatedKey.ref(32),
          name: 'staff',
          description: 'Staff',
          priority: 4,
        },
        {
          id: generatedKey.ref(32),
          name: 'parent',
          description: 'Parent',
          priority: 5,
        },
      ];
      await this.roleRepository.save(roles);
    }

    const roles = await this.roleRepository.find({
      where: { delete: false },
      order: { priority: 'ASC' },
    });
    const roleIds = roles.map((role) => role.id);
    const roleNames = Object.values(TypeUser);
    // const roleIds = [];
    // for (const roleName of roleNames) {
    //   const role = roles.find((role) => role.name === roleName);
    //   if (role) {
    //     roleIds.push(role.id);
    //   }
    // }
    await this.initData.initPermissionData(roleIds);

    // Create language
    const defaultLanguage = this.config.get('DEFAULT_LANGUAGE');
    if ((await this.languageRepository.find()).length == 0) {
      const languages = [
        // {
        //   id: generatedKey.ref(32),
        //   language: defaultLanguage,
        //   code: 'en',
        //   country_code: 'gb',
        //   country_name: 'United Kingdom',
        //   flag: 'https://flagcdn.com/gb.svg',
        //   default: true,
        // },
        {
          id: generatedKey.ref(32),
          language: 'Vietnamese',
          code: 'vi',
          country_code: 'vn',
          country_name: 'Vietnam',
          flag: 'https://flagcdn.com/vn.svg',
          default: true,
        },
        // {
        //   id: generatedKey.ref(32),
        //   language: defaultLanguage,
        //   code: 'en',
        //   country_code: 'en',
        //   country_name: 'United States',
        //   flag: 'https://flagcdn.com/us.svg',
        //   default: true,
        // },
        // {
        //   id: generatedKey.ref(32),
        //   language: 'Japanese',
        //   code: 'ja',
        //   country_code: 'jp',
        //   country_name: 'Japan',
        //   flag: 'https://flagcdn.com/jp.svg',
        //   default: false,
        // },
        // {
        //   id: generatedKey.ref(32),
        //   language: 'French',
        //   code: 'fr-FR',
        //   country_code: 'fr',
        //   country_name: 'France',
        //   flag: 'https://flagcdn.com/fr.svg',
        //   default: false,
        // },
      ];
      await this.languageRepository.save(languages);
    }

    // Create admin user
    if ((await this.userRepository.find()).length == 0) {
      const id = generatedKey.ref(32);
      const username = this.config.get('ADMIN_NAME');
      const password = await generatedKey.refTemp(this.config.get('TEMP_PASSWORD'));

      const user = this.userRepository.create({
        id,
        username,
        password,
        is_need_change_password: false,
        fullname: 'System Administrator',
        active: true,
      });

      await this.userRepository.save(user);

      // Create UserRole
      const role = await this.roleRepository.findOneBy({ name: roleNames[0] });
      const userRole = this.userRoleRepository.create({
        id: generatedKey.ref(32),
        role_id: role.id,
        user_id: id,
      });
      await this.userRoleRepository.save(userRole);

      // Create UserLanguage
      const language = await this.languageRepository.findOneBy({ language: defaultLanguage });
      const useLanguage = this.userLanguageRepository.create({
        id: generatedKey.ref(32),
        language_id: language.id,
        user_id: id,
      });
      await this.userLanguageRepository.save(useLanguage);
    }
  }

  async deleteUser(userId: string, userReq: UserPayload) {
    const exitedUser = await this.userRepository.findOneBy({ id: userId, delete: false });
    if (!exitedUser) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    const timestamp = Date.now();
    const saveUsername = `${timestamp}_${exitedUser.username}`;

    // Update user-verfication
    const userVerification = await this.userVerificationRepository.findOneBy({
      username: exitedUser.username,
    });
    if (userVerification) {
      userVerification.username = saveUsername;
      await this.userVerificationRepository.save(userVerification);
    }

    // Update user-role
    const userRoles = await this.userRoleRepository.findBy({
      user_id: userId,
      delete: false,
    });
    if (userRoles.length > 0) {
      userRoles.forEach((role) => {
        role.delete = true;
      });
      await this.userRoleRepository.save(userRoles);
    }

    // Update user
    const userResult = this.resetUser(exitedUser, saveUsername, userReq);
    await this.userRepository.save(userResult);
  }

  async changePassword(user: any, dto: ChangePasswordRequest) {
    const userEntity = await this.userRepository.findOneBy({ id: user.userId, delete: false });
    if (!userEntity) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    if (!(await bcrypt.compare(dto.current_password, userEntity.password))) {
      throw new HttpException(ErrorCode.password_is_incorrect, HttpStatus.BAD_REQUEST);
    }

    if (dto.current_password == dto.new_password) {
      throw new HttpException(
        ErrorCode.the_new_password_cannot_be_the_same_as_the_current_password,
        HttpStatus.BAD_REQUEST,
      );
    }

    const password = await generatedKey.refTemp(dto.new_password);
    await this.userRepository.save({ ...userEntity, password });
  }

  async updateLanguage(userId: string, dto: UpdateLanguageRequest) {
    const userEntity = await this.userRepository.findOneBy({ id: userId, delete: false });
    if (!userEntity) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    const languageEntity = await this.languageRepository.findOneBy({ id: dto.language_id, delete: false });
    if (!languageEntity) {
      throw new HttpException(ErrorCode.language_not_existed, HttpStatus.NOT_FOUND);
    }

    try {
      const userLanguage = await this.userLanguageRepository.findOneBy({ user_id: userId });
      if (!userLanguage) return;
      await this.userLanguageRepository.save({
        ...userLanguage,
        language_id: dto.language_id,
      });
    } catch (error) {
      throw new HttpException(ErrorCode.update_user_language_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createUserVerification(createDto: RequestUser, type: string, activeStatus?: boolean, otp?: string) {
    const user = await this.userRepository.findOneBy({ username: createDto.username });
    if (!user) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    let userVerification = await this.userVerificationRepository.findOneBy({ username: createDto.username, type });
    otp = otp || Math.floor(100000 + Math.random() * 899999).toString();
    activeStatus = activeStatus !== undefined ? activeStatus : true;

    if (userVerification && userVerification != null) {
      if (type === 'CREATE' && userVerification.delete === false) {
        throw new HttpException(ErrorCode.user_has_been_verified, HttpStatus.BAD_REQUEST);
      }
      userVerification.otp = otp;
      userVerification.time_request = new Date();
      userVerification.update_date = new Date();
      userVerification.type = type;
      userVerification.email = createDto.username;
      userVerification.delete = !activeStatus;
    } else {
      userVerification = this.userVerificationRepository.create({
        id: generatedKey.ref(32),
        username: createDto.username,
        otp: otp,
        time_request: new Date(),
        type: type,
        email: createDto.username,
        delete: !activeStatus,
      });
    }
    await this.userVerificationRepository.save(userVerification);

    // Sent mail
    const emailType = type === 'CREATE' && activeStatus ? 'CREATE' : 'VERIFY';
    await this.sendEmail(user.email, otp, emailType, user.fullname, user.username);

    return;
  }

  async resetPassword(dto: ResetPassWord) {
    const user = await this.userRepository.findOneBy({ username: dto.username });
    if (!user) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    const type = TypeSensMail.reset_password;
    let userVerification = await this.userVerificationRepository.findOneBy({ username: dto.username, type });
    const otp = Math.floor(100000 + Math.random() * 899999).toString();
    const activeStatus = true;

    if (userVerification && userVerification != null) {
      // if (type === TypeSensMail.reset_password && userVerification.delete === false) {
      //   throw new HttpException(ErrorCode.user_has_been_verified, HttpStatus.BAD_REQUEST);
      // }
      userVerification.otp = otp;
      userVerification.time_request = new Date();
      userVerification.update_date = new Date();
      userVerification.type = type;
      userVerification.email = dto.username;
      userVerification.delete = !activeStatus;
    } else {
      userVerification = this.userVerificationRepository.create({
        id: generatedKey.ref(32),
        username: dto.username,
        otp: otp,
        time_request: new Date(),
        type: type,
        email: dto.username,
        delete: !activeStatus,
      });
    }
    await this.userVerificationRepository.save(userVerification);

    // Sent mail
    const emailType = TypeSensMail.reset_password;
    await this.sendEmail(user.email, otp, emailType, user.fullname, user.username);

    return;
  }

  async checkTimeVerification(username: string, forget: boolean, type: string) {
    const user = await this.userRepository.findOneBy({ username: username, delete: false });
    if (!user) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    // const type = forget ? 'FORGET_PASSWORD' : 'CREATE';

    const userVerificationEntity = await this.userVerificationRepository.findOneBy({ username: username, type });
    if (!userVerificationEntity) {
      throw new HttpException(ErrorCode.verification_code_not_existed, HttpStatus.NOT_FOUND);
    }

    // if (user) {
    //   if (forget) {
    //     // send Otp || email
    //     let createDto = new RequestUser();
    //     createDto.username = username;
    //     await this.createUserVerification(createDto, 'FORGET_PASSWORD', false);
    //   }

    //   throw new HttpException(ErrorCode.user_already_exist, HttpStatus.NOT_FOUND);
    // }

    const currentTime = new Date().getMinutes();
    const timeRequest = new Date(userVerificationEntity.time_request).getMinutes();

    if (userVerificationEntity.type == 'CREATE' && currentTime - timeRequest > this.config.get('TIMEOUT_CREATE')) {
      throw new HttpException(ErrorCode.verification_expired, HttpStatus.BAD_REQUEST);
    } else if (
      userVerificationEntity.type == 'FORGET_PASSWORD' &&
      currentTime - timeRequest > this.config.get('TIMEOUT_FORGET_PASSWORD')
    ) {
      throw new HttpException(ErrorCode.verification_expired, HttpStatus.BAD_REQUEST);
    }
    // throw new HttpException(ErrorCode.verification_not_expired, HttpStatus.BAD_REQUEST);
  }

  async getUserVerification(username: string, type: string) {
    return await this.userVerificationRepository.findOneBy({ username, type });
  }

  async getUserVerificationByOtp(username: string, password: string) {
    return await this.userVerificationRepository.findOneBy({ username, otp: password });
  }

  async getUserVerificationByUsername(username: string) {
    return await this.userVerificationRepository.findOneBy({ username });
  }

  async checkUserForget(username: string) {
    const user = await this.userRepository.findOneBy({ username: username });
    if (!user) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    const type = TypeSensMail.forget_password;
    await this.checkTimeVerification(username, true, type);
  }

  // async createVerification(dto: CreateRequestUser) {
  //   return await this.createUserVerification(dto);
  // }

  resetUser(resetUser: User, oldUsername: string, userReq: any) {
    resetUser.username = oldUsername;
    resetUser.delete = true;
    resetUser.fullname = null;
    resetUser.gender = null;
    resetUser.address = null;
    resetUser.birthday = null;
    resetUser.email = null;
    resetUser.phone = null;
    resetUser.avatar = null;
    resetUser.full_avatar = null;
    resetUser.job = null;
    resetUser.update_by = userReq.id;
    resetUser.update_date = new Date();
    return resetUser;
  }

  /**
   *
   * @param username
   * @returns
   */
  async getRole(username: string): Promise<Role | undefined> {
    const user = await this.queryUser(username, null);
    return user.userRoles[0].role;
  }

  /**
   *
   * @param language
   * @returns
   */
  async getLanguage(language: string): Promise<Language | undefined> {
    const lang = await this.languageRepository.findOneBy({ language: language, delete: false });
    return lang;
  }

  /**
   *
   * @param user
   * @returns
   */
  async checkUserExist(user: UserPayload) {
    const usr = await this.userRepository.findOneBy({ id: user.userId });
    if (!usr) return false;
    return true;
  }

  /**
   *
   * @param username
   * @returns
   */
  async findUserRole(username: string) {
    const user = await this.queryUser(username, null);

    if (!user) return false;
    for (let i = 0; i <= user.userRoles.length; i++) {
      // return user.userRoles[i].roles.name == 'admin' ? true : false;
      return true;
    }
  }

  /**
   * Get roles of user
   * @param username
   * @returns
   */
  async getRolebyUsers(userId: string) {
    const roles = await this.userRoleRepository
      .createQueryBuilder('user_role')
      .select('role.name as name')
      .leftJoin('user_role.role', 'role')
      .where('user_role.user_id = :userId', { userId: userId })
      .orderBy('role.priority', 'ASC')
      .getRawMany();

    return roles.map((e) => e.name);
  }

  async createUserRole(userId: string, roleId: string) {
    const userRole = await this.userRoleRepository.create({
      id: generatedKey.ref(32),
      role_id: roleId,
      user_id: userId,
    });

    await this.userRoleRepository.save(userRole);
  }

  async getRoleByName(name: string) {
    return await this.roleRepository.findOneBy({ name: name, delete: false });
  }

  // async createUser(userId: string, dto: CreateParentDto) {
  //   try {
  //     const userDto = {
  //       fullname: dto.fullname,
  //       phone: dto.phone,
  //       username: dto.phone,
  //       email: dto.email,
  //       address: dto.address,
  //       birthday: !!dto.birthday ? dto.birthday : null,
  //       avatar: dto.avatar,
  //       full_avatar: dto.full_avatar,
  //       is_need_change_password: true,
  //       password: await this.getPassWordDefault(),
  //     };
  //     const user = await this.userRepository.create({ ...userDto, id: userId });
  //     await this.userRepository.save(user);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  // async createUserStaff(userId: string, dto: CreateStaffDto) {
  //   const userDto = {
  //     fullname: dto.fullname,
  //     phone: dto.phone,
  //     username: dto.phone,
  //     email: dto.email,
  //     address: dto.address,
  //     birthday: !!dto.birthday ? dto.birthday : null,
  //     avatar: dto.avatar,
  //     full_avatar: dto.full_avatar,
  //     is_need_change_password: true,
  //     password: await this.getPassWordDefault(),
  //   };
  //   const user = await this.userRepository.create({ ...userDto, id: userId });
  //   await this.userRepository.save(user);
  // }

  // async createStudentUser(userId: string, studentId: string) {
  //   let studentUser = await this.studentUserRepository.create({
  //     id: generatedKey.ref(32),
  //     student_id: studentId,
  //     user_id: userId,
  //   });
  //   await this.studentUserRepository.save(studentUser);
  // }

  async removeUserRole(userId: string) {
    let userRoles = await this.userRoleRepository.findOneBy({ user_id: userId, delete: false });
    userRoles.delete = true;
    await this.userRoleRepository.save(userRoles);
  }

  async removeUserRoleById(userRole: string, userId: string) {
    let userRoles = await this.userRoleRepository.findOneBy({
      id: userRole,
      user_id: userId,
      delete: false,
    });
    if (userRoles) {
      userRoles.delete = true;
    }
    await this.userRoleRepository.save(userRoles);
  }

  async getPassWordDefault() {
    return await generatedKey.refTemp(this.config.get('TEMP_PASSWORD'));
  }

  async deleteUserRole(userId: string) {
    let userRoles = await this.userRoleRepository.findBy({ user_id: userId });
    if (userRoles.length == 0) return;
    await this.userRoleRepository.remove(userRoles);
  }

  async sendOtp(phone: string, otp: string) {
    try {
      const branchName = this.config.get('BRAND_NAME');
      const tranId = `${branchName} ${generatedKey.ref(32)}`;
      // const smsClient = JSON.parse('{"code":37, "message:":"Success", "transId":"BTEDUCATION ekPUxGIkiwwg3s9kH4d4nfaBuaj4unC5", "oper":"VTE", "totalSMS:":1}');
      return await this.smsClient.SendOtp(phone, tranId, otp);
    } catch (exception) {
      console.log(exception);
      return;
    }
  }

  async sendEmail(email: string, otp: string, emailType: string, fullname: string, username: string) {
    let recipients = [];
    try {
      const name = fullname == null || fullname == '' ? username : fullname;
      if (emailType == 'VERIFY') {
        recipients.push({
          email: email,
          name: name,
          dynamic_template_data: {
            name: name,
            otp: otp,
            url: this.config.get('URL_FORGET_PASS') + username,
          },
        });
        return await this.smsClient.sendGridEmailForget(recipients);
      } else if (emailType == 'CREATE') {
        recipients.push({
          email: email,
          name: name,
          dynamic_template_data: {
            name: name,
            username: username,
            otp: otp,
          },
        });
        // return await this.smsClient.sendEmail(email, otp, emailType);
        return await this.smsClient.sendGridEmailRegister(recipients);
      } else if (emailType == TypeSensMail.reset_password) {
        recipients.push({
          email: email,
          name: name,
          dynamic_template_data: {
            name: name,
            otp: otp,
            url: this.config.get('URL_FORGET_PASS') + username,
          },
        });
        return await this.smsClient.sendGridEmailResetPass(recipients);
      }
    } catch (exception) {
      console.log(exception);
      return;
    }
  }

  async validateVideo(fileDto: Express.Multer.File) {
    let fileNameArr = fileDto.originalname.split('.');
    const fileType = fileNameArr[fileNameArr.length - 1];
    const fileTypes = this.config.get('FILE_TYPE_VIDEOS');
    const maxSize = this.config.get('MAXSIZE_VIDEO');
    if (!fileTypes.includes(fileType.toLocaleUpperCase())) {
      throw new HttpException(ErrorCode.invalid_file_type, HttpStatus.BAD_REQUEST);
    }

    if (fileDto.size > maxSize) {
      throw new HttpException(ErrorCode.file_size_is_too_large, HttpStatus.BAD_REQUEST);
    }
  }

  async uploadVideo(dto: UploadVideoDto, fileDto: Express.Multer.File) {
    await this.validateVideo(fileDto);
    let fileNameArr = fileDto.originalname.split('.');
    const name = fileNameArr[fileNameArr.length - 2];
    const type = fileNameArr[fileNameArr.length - 1];
    const timestamp = Date.now();
    const floderS3 = `VIDEO/${timestamp}`;
    const fileNamePathS3 = `${floderS3}/${name}`;
    const result = await this.imageHelper.saveVideo({
      file: fileDto,
      fileName: `${name}.${type}`,
      folderName: `${floderS3}`,
    });
    if (result.length === 0) {
      throw new HttpException(ErrorCode.upload_file_not_success, HttpStatus.BAD_REQUEST);
    }

    const videoUrl = this.imageHelper.parseS3Result(result, 'video');
    let objMedia = { videoUrl: videoUrl.original, imgUrl: '' };
    ffmpeg.setFfmpegPath(ffmpegPath);
    const unlink = util.promisify(fs.unlink);
    const floder = 'thumbnails';
    const filenameImg = `${timestamp}_thumbnail.png`;
    const filePath = path.join(process.cwd(), floder);
    const filePathFull = `${filePath}/${filenameImg}`;
    let withHeightVideo = await this.getWithHeightVideo(videoUrl.original);
    try {
      const tg = new ThumbnailGenerator({
        sourcePath: objMedia.videoUrl,
        thumbnailPath: floder,
        tmpDir: 'directory',
      });

      await new Promise((resolve, reject) => {
        tg.generateOneByPercentCb(50, { size: withHeightVideo, filename: `${filenameImg}` }, (err, result) => {
          if (err) {
            console.log('Error generating thumbnail: ', err);
            reject(err);
          } else {
            console.log('Thumbnail generated successfully at: ', result);
            resolve(result);
          }
        });
      });

      const fileContent = fs.readFileSync(filePathFull);
      const s3Params = {
        Bucket: this.config.get('AWS_S3_BUCKET'),
        Key: `${fileNamePathS3}.png`,
        Body: fileContent,
        ContentType: 'image/png',
        ACL: 'public-read',
      };

      const result = await this.s3.upload(s3Params).promise();
      objMedia.imgUrl = result?.Location;

      // Delete the temporary file
      await unlink(filePathFull);
    } catch (error) {
      console.log(error);
      throw new HttpException(ErrorCode.upload_image_not_success, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return objMedia;
  }

  async getWithHeightVideo(videoURL: string) {
    try {
      const dimensions = await getDimensions(videoURL);
      return `${dimensions.width}x${dimensions.height}`;
    } catch (error) {
      console.log(error);
    }
    return '860x640';
  }

  async lists(query: FilterUserDto) {
    let response = {
      timestamp: new Date(),
      data: [],
      skip: query.skip,
      limit: query.limit,
      number: [].length,
      total: [].length,
    };
    let users = null;
    users = await this.userRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.userRoles', 'user_role', 'user_role.delete = :del', { del: false })
      .leftJoinAndSelect('user_role.role', 'role')
      .leftJoinAndSelect('users.userLanguages', 'user_language', ' user_language.delete = :del', { del: false })
      .leftJoinAndSelect('user_language.language', 'language')
      .leftJoinAndSelect('users.office', 'office', 'office.id = users.office_id')
      .orderBy('users.update_date', 'DESC')
      .where({ delete: false });

    if (query && query.role) {
      users.andWhere('role.name = :roleName', { roleName: query.role });
    }

    if (query && query.office_id) {
      users.andWhere('office.id = :idOffice', { idOffice: query.office_id });
    }

    let listUsers = await users.getMany();
    if (!listUsers || listUsers.length == 0) {
      return response;
    }
    if (query.name) {
      listUsers = listUsers.filter((rs) => {
        let matchName = true;
        let matchUsername = true;

        if (rs.fullname === null) {
          matchName = false;
        } else if (query.name) {
          matchName = removeAccents(rs.fullname.toLowerCase()).includes(removeAccents(query.name.toLowerCase()));
        }

        if (rs.username === null) {
          matchUsername = false;
        } else if (query.name) {
          matchUsername = removeAccents(rs.username.toLowerCase()).includes(removeAccents(query.name.toLowerCase()));
        }

        // Apply the filtering logic
        return matchName || matchUsername;
      });
    }

    const totalUsers = listUsers.length;
    let paginatedUsers = (await paginate(listUsers, query.skip, query.limit)).items;
    if (query.sort_by == SortBy.date && query.order_by == OrderBy.asc) {
      paginatedUsers.sort((a, b) => {
        const dateA = a.update_date ? (a.update_date as Date).getTime() : 0;
        const dateB = b.update_date ? (b.update_date as Date).getTime() : 0;
        return dateA - dateB;
      });
    } else if (query.sort_by == SortBy.date && query.order_by == OrderBy.desc) {
      paginatedUsers.sort((a, b) => {
        const dateA = a.update_date ? (a.update_date as Date).getTime() : 0;
        const dateB = b.update_date ? (b.update_date as Date).getTime() : 0;
        return dateB - dateA;
      });
    }

    let datas = [];
    for (let i = 0; i < paginatedUsers.length; i++) {
      let roles = [];
      roles = roles.concat(
        paginatedUsers[i].userRoles
          .map((e) => e.role)
          .sort(dynamicSort('priority'))
          .map((e) => e.name),
      );

      datas.push({
        id: paginatedUsers[i].id,
        username: paginatedUsers[i].username,
        fullname: paginatedUsers[i].fullname,
        department_name: paginatedUsers[i].department_name,
        officer_number: paginatedUsers[i].officer_number,
        lastname:
          paginatedUsers[i].fullname === null
            ? ''
            : paginatedUsers[i].fullname.substring(0, paginatedUsers[i].fullname.indexOf(' ')),
        firstname:
          paginatedUsers[i].fullname === null
            ? ''
            : paginatedUsers[i].fullname.substring(paginatedUsers[i].fullname.lastIndexOf(' ') + 1),
        avatar: paginatedUsers[i].avatar,
        full_avatar: paginatedUsers[i].full_avatar,
        language: paginatedUsers[i].userLanguages[0]?.language?.language,
        roles,
        address: paginatedUsers[i].address,
        birthday: paginatedUsers[i].birthday,
        gender: paginatedUsers[i].gender,
        email: paginatedUsers[i].email,
        phone: paginatedUsers[i].phone,
        job: paginatedUsers[i].job,
        active: paginatedUsers[i].active,
        code: paginatedUsers[i].code,
        office_id: paginatedUsers[i].office?.id ?? '',
        office_name: paginatedUsers[i].office?.name ?? '',
      });
    }

    if (query.sort_by == SortBy.name && query.order_by == OrderBy.asc) {
      listUsers = await sortByFirstname(datas, 'asc');
    } else if (query.sort_by == SortBy.name && query.order_by == OrderBy.desc) {
      listUsers = await sortByFirstname(datas, 'desc');
    }

    response.data = datas;
    response.number = datas.length;
    response.total = totalUsers;
    return response;
  }

  async exportUsers(res: Response, query: FilterUserDto): Promise<void> {
    try {
      const datas = await this.lists(query);
      const users = datas.data;

      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet();

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Họ và tên', key: 'fullname', width: 20 },
        { header: 'Số hiệu cán bộ', key: 'officer_number', width: 15 },
        { header: 'Phòng ban', key: 'department_name', width: 15 },
        { header: 'Vai trò', key: 'roles', width: 10 },
        { header: 'Số điện thoại', key: 'phone', width: 15 },
        { header: 'Email', key: 'username', width: 25 },
        { header: 'Cơ sở', key: 'office_name', width: 25 },
      ];

      this.styleHeaderRow(worksheet);

      users.forEach((user, index) => {
        const formattedUser = {
          ...user,
          roles: user.roles.length === 0 ? '' : user.roles[0],
        };
        // +84 format phone
        // if (formattedUser.phone && formattedUser.phone.startsWith('+84')) {
        //   formattedUser.phone = '0' + formattedUser.phone.slice(3);
        // }

        const row = worksheet.addRow({
          stt: index + 1,
          ...formattedUser,
        });
        this.applyRoleStyle(row.getCell('roles'));
      });

      this.styleSheet(worksheet);

      const buffer = await workbook.xlsx.writeBuffer();
      const date = new Date();

      const formattedDateTime = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(
        2,
        '0',
      )}${date.getFullYear()}`;

      const fileName = `Danh_sach_nguoi_dung_${formattedDateTime}.xlsx`;
      const encodedFileName = encodeURIComponent(`Danh sách người dùng_${formattedDateTime}.xlsx`); // convert special characters

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}; filename*=UTF-8''${encodedFileName}`);
      res.send(buffer);
    } catch (error) {
      console.error('Error in export method:', error);
      throw new HttpException(ErrorCode.data_export_failed, HttpStatus.BAD_REQUEST);
    }
  }

  private styleHeaderRow(sheet: any): void {
    const headerRow = sheet.getRow(1);
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '096DD9' } };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  }

  private styleSheet(sheet: any): void {
    sheet.columns.forEach((column) => {
      column.alignment = { horizontal: 'left', vertical: 'middle' };
    });
    sheet.getColumn('stt').alignment = { horizontal: 'center' };
  }

  private applyRoleStyle(cell: any): void {
    switch (cell.value) {
      case 'admin':
        cell.font = { color: { argb: 'F5222D' } };
        break;
      case 'staff':
        cell.font = { color: { argb: '722ED1' } };
        break;
      case 'parent':
        cell.font = { color: { argb: '1677FF' } };
        break;
      default:
        break;
    }
  }
  // Timezone format
  // private adjustToLocalTime(date: Date | string): Date {
  //     const d = new Date(date);
  //     const offset = 7;
  //     d.setHours(d.getHours() + offset);
  //     return d;
  // }

  private async getOfficeByOfficeName(officeName: string): Promise<Office> {
    try {
      const office = await this.officeRepository
        .createQueryBuilder('office')
        .where('LOWER(TRIM(office.name)) = LOWER(TRIM(:name))', { name: officeName })
        .getOne();

      return office;
    } catch (error) {
      console.error('Error in getOfficeByOfficeName method:', error);
      throw new Error('Failed to process get office');
    }
  }

  private async handleImportRoleName(rowRoleName: string, userId: string): Promise<void> {
    try {
      const roleMap = {
        'hiệu trưởng': TypeUser.Admin,
        'phụ huynh': TypeUser.Parent,
        'quản lý': TypeUser.Staff,
      };

      const cleanedRoleName = rowRoleName?.trim().toLowerCase();

      if (!cleanedRoleName || !roleMap[cleanedRoleName]) {
        return;
      }

      const roleName = roleMap[cleanedRoleName];
      const role = await this.getRoleByName(roleName);

      const userRole = await this.userRoleRepository.findOne({
        where: { delete: false, role_id: role.id, user_id: userId },
      });

      if (!userRole) {
        await this.createUserRole(userId, role.id);
      }
    } catch (error) {
      console.error('Error in handleImportRoleName method:', error);
      throw new Error('Failed to process handle import role');
    }
  }
  async import(file: Express.Multer.File): Promise<void> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });

      for (const row of data) {
        const user = await this.userRepository.findOne({ where: { username: row['Email'] } });
        const office = await this.getOfficeByOfficeName(row['Cơ sở']);
        if (!office) {
          continue;
        }
        if (user) {
          user.fullname = row['Họ và tên'];
          user.code = row['Số hiệu cán bộ'];
          user.department_name = row['Phòng ban'];
          user.phone = row['Số điện thoại'];
          user.office_id = office.id;
          user.update_date = new Date();
          await this.userRepository.save(user);
          this.handleImportRoleName(row['Vai trò'], user.id);
        } else {
          const userNew = this.userRepository.create({
            id: generatedKey.ref(32),
            fullname: row['Họ và tên'],
            code: row['Số hiệu cán bộ'],
            department_name: row['Phòng ban'],
            phone: row['Số điện thoại'],
            office_id: office.id,
            username: row['Email'],
            email: row['Email'],
            password: await this.getPassWordDefault(),
            is_need_change_password: true,
          });
          await this.userRepository.save(userNew);
          this.handleImportRoleName(row['Vai trò'], userNew.id);
        }
      }
    } catch (error) {
      console.error('Error in importUsersFromExcel method:', error);
      throw new Error('Failed to process the Excel file');
    }
  }
}
