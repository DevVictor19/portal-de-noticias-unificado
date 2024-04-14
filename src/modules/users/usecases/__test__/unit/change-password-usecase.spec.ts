import { NotFoundException, UnauthorizedException } from '@nestjs/common';

import { ChangePasswordUseCase } from '../../change-password-usecase';

import { TOKEN_TYPE } from '@/common/enums/token-type.enum';
import { DatabaseServiceMock } from '@/modules/common/database/__MOCKS__/database-service.mock';
import { IDatabaseService } from '@/modules/common/database/database-service.interface';
import { JwtProviderMock } from '@/modules/common/jwt/__MOCKS__/jwt-provider.mock';
import { IJwtProvider } from '@/modules/common/jwt/jwt-provider.interface';
import { UserEntity } from '@/modules/users/entities/users.entity';
import { HashProviderMock } from '@/modules/users/providers/hash/__MOCKS__/hash-provider.mock';
import { IHashProvider } from '@/modules/users/providers/hash/hash-provider.interface';

describe('ChangePasswordUseCase unit tests', () => {
  let databaseService: IDatabaseService;
  let jwtProvider: IJwtProvider;
  let hashProvider: IHashProvider;
  let sut: ChangePasswordUseCase;

  const input = { password: 'password', token: 'token' };

  beforeEach(() => {
    databaseService = new DatabaseServiceMock();
    hashProvider = new HashProviderMock();
    jwtProvider = new JwtProviderMock();

    sut = new ChangePasswordUseCase(databaseService, jwtProvider, hashProvider);
  });

  it('Should throw UnauthorizedException if token is invalid', async () => {
    const verifyJwtSpy = jest.spyOn(jwtProvider, 'verify');
    verifyJwtSpy.mockReturnValue(null);

    await expect(() => sut.execute(input)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifyJwtSpy).toHaveBeenCalledWith(input.token);
  });

  it('Should throw UnauthorizedException if token_type is invalid', async () => {
    const verifyJwtSpy = jest.spyOn(jwtProvider, 'verify');
    verifyJwtSpy.mockReturnValue({ token_type: 'wrong token type' });

    await expect(() => sut.execute(input)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifyJwtSpy).toHaveBeenCalledWith(input.token);
  });

  it('Should throw NotFoundException if user is not found', async () => {
    const tokenPayload = {
      token_type: TOKEN_TYPE.PASSWORD_RECOVERY,
      userId: 'id',
    };

    const verifyJwtSpy = jest.spyOn(jwtProvider, 'verify');
    verifyJwtSpy.mockReturnValue(tokenPayload);
    const findByIdSpy = jest.spyOn(databaseService.users, 'findById');
    findByIdSpy.mockResolvedValue(null);

    await expect(() => sut.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(verifyJwtSpy).toHaveBeenCalledWith(input.token);
    expect(findByIdSpy).toHaveBeenCalledWith(tokenPayload.userId);
  });

  it('Should update user password with provided the input password', async () => {
    const tokenPayload = {
      token_type: TOKEN_TYPE.PASSWORD_RECOVERY,
      userId: 'id',
    };
    const user = { id: 'userId', password: 'old pass' } as UserEntity;

    const verifyJwtSpy = jest.spyOn(jwtProvider, 'verify');
    verifyJwtSpy.mockReturnValue(tokenPayload);
    const findByIdSpy = jest.spyOn(databaseService.users, 'findById');
    findByIdSpy.mockResolvedValue(user);
    const generateHashSpy = jest.spyOn(hashProvider, 'generateHash');
    generateHashSpy.mockResolvedValue('new hashed pass');
    const updateUserSpy = jest.spyOn(databaseService.users, 'update');

    await sut.execute(input);

    const newPass = await generateHashSpy.mock.results[0].value;
    const updatedUser = { ...user, password: newPass };

    expect(verifyJwtSpy).toHaveBeenCalledWith(input.token);
    expect(findByIdSpy).toHaveBeenCalledWith(tokenPayload.userId);
    expect(generateHashSpy).toHaveBeenCalledWith(input.password);
    expect(updateUserSpy).toHaveBeenCalledWith(user.id, updatedUser);
  });
});
