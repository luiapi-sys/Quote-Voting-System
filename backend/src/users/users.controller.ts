
// src/users/users.controller.ts
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get current user detailed statistics' })
  @ApiResponse({ status: 200, description: 'User stats retrieved' })
  getUserStats(@Request() req) {
    return this.usersService.getUserStats(req.user.id);
  }
}


