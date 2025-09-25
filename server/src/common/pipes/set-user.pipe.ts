import {
  ArgumentMetadata,
  Inject,
  Injectable,
  PipeTransform,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import express from 'express';
import { UserProfileDto } from '../dto/user-profile.dto';

type ValueUserType = Record<string, any>;

interface CognitoUser {
  fullName?: string;
  username?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class SetUserPipe implements PipeTransform {
  constructor(@Inject(REQUEST) protected readonly request: express.Request) {}

  transform(
    value: ValueUserType | ValueUserType[],
    metadata: ArgumentMetadata,
  ) {
    const method = this.request.method;
    const user = this.request.user as UserProfileDto;
    const fullName = user?.name ?? 'system';

    if (metadata.type === 'body' || metadata.type === 'param') {
      if (Array.isArray(value)) {
        if (method === 'POST') {
          value.forEach((item) => {
            item.createdUser = fullName;
            item.updatedUser = fullName;
          });
        } else if (['PUT', 'PATCH', 'DELETE'].includes(method)) {
          value.forEach((item) => {
            item.updatedUser = fullName;
          });
        }
      } else if (value) {
        if (method === 'POST') {
          value.createdUser = fullName;
          value.updatedUser = fullName;
        } else if (['PUT', 'PATCH', 'DELETE'].includes(method)) {
          value.updatedUser = fullName;
        }
      }
    }

    return value;
  }
}
