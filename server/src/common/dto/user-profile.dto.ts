export class UserProfileDto {
  constructor(
    public userId: string,
    public username: string,
    public email: string,
    public name: string,
  ) {}
}
